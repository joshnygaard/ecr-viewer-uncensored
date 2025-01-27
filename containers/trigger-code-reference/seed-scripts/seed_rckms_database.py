#!/usr/bin/env python
"""
seed_rckms_database.py
===========

A significantly paired down version of the original script to seed the RCKMS database. This script will extract the conditions from the RCKMS docx files and load them into the SQLite database.


Example:
    $ python seed_rckms_database.py <archive.zip> <database.db>
"""

import argparse
import dataclasses
import os
import sqlite3
import typing
import zipfile

import bs4
import mammoth


@dataclasses.dataclass
class Condition:
    """
    A Condition extracted from an RCKMS docx file
    """

    name: str
    version: str
    snomed: str
    system: str = "https://www.rckms.org/content-repository/"

    def __str__(self):
        """A string representation of the Condition object."""
        return f"{self.name} [{self.snomed}]"


def initialize_database(db: str) -> None:
    """
    Initialize the SQLite database with the starting schema.

    :param db: The path to the SQLite database.

    :return: None
    """
    # remove the existing database file if it exists to start fresh
    os.remove(db)
    with sqlite3.connect(db) as con:
        with open("./migrations/rckms_create_Tables_add_indexes") as f:
            con.executescript(f.read())
        con.commit()


def list_docx_files(archive: str) -> typing.Iterable[tuple[str, typing.IO[bytes]]]:
    """
    Unzip the archive and list all the docx files nested within.  For each docx file,
    extract the file name and file object and yield a tuple of the two.

    :param archive: The path to the archive file.

    :return: An iterable of tuples containing the filename and file object.
    """
    with zipfile.ZipFile(archive) as z:
        for name in z.namelist():
            if name.endswith(".docx"):
                with z.open(name) as f:
                    yield name, f


def extract_condition_from_rckms_doc(
    filename: str, tree: bs4.BeautifulSoup
) -> Condition:
    """
    Given a RCKMS docx file, iterate through items specified in the summary and extract
    data from the file name to construct a Condition object.

    :param filename: The filename of the docx file.
    :param tree: The file object as a BeautifulSoup object

    :return: A Condition object.
    """
    # extract the basename minus the extension
    basename = os.path.basename(filename).rsplit(".", 1)[0]
    # determine the split character based on the presence of a '.' or '_'
    split = "." if "." in basename else "_"
    # split the basename into the condition and version
    name, version = basename.rsplit(split, 1)
    snomed = ""
    # find the first list in the tree
    first_list = tree.find("ul")
    if first_list:
        for ident in first_list.find_all("li"):
            # split the key and value, using the first '=' as the delimiter
            parts = ident.text.split("=", 1)
            # some items may not have a '=' delimiter, so skip them
            if len(parts) == 2:
                # convert the key to lowercase and strip any whitespace
                key = parts[0].strip().lower()
                # split the value and take the first part, then strip any whitespace
                val = parts[1].strip().split("|")[0].strip()
                # if the first part of the value is numeric, use only that
                if val.split()[0].isnumeric():
                    val = val.split()[0]
                if key == "condition":
                    name = val
                elif "snomed" in key:
                    snomed = val
    return Condition(name=name, version=version, snomed=snomed)


def parse_archive(archive: str) -> list[Condition]:
    """
    Given an archive of RCKMS reporting specifications, extract the conditions.

    :param archive: The path to the archive file.

    :return: A list Conditions extracted
    """
    conditions: list[Condition] = []

    count = 0
    for fname, fobj in list_docx_files(archive):
        count += 1
        # convert microsoft docx to html
        html = mammoth.convert_to_html(fobj)
        # convert HTML string into a BeautifulSoup tree
        tree = bs4.BeautifulSoup(html.value, "lxml")
        # extract the Condition from the RCKMS docx file
        condition = extract_condition_from_rckms_doc(fname, tree)
        conditions.append(condition)
    return conditions


def load_database(
    db: str,
    conditions: typing.Collection[Condition],
) -> None:
    """
    Load the Conditions into the SQLite database.

    :param db: The path to the SQLite database.
    :param conditions: A collection of Condition objects.

    """
    with sqlite3.connect(db) as con:
        cur = con.cursor()
        for condition in conditions:
            # insert the Condition into the database if it does not exist
            cur.execute(
                "INSERT INTO conditions (id, system, name) "
                "VALUES (:snomed, 'http://snomed.info/sct', :name) "
                "ON CONFLICT DO NOTHING",
                condition.__dict__,
            )
        con.commit()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "archive", type=argparse.FileType(), help="The archive file to process"
    )
    parser.add_argument(
        "database",
        type=argparse.FileType("wb"),
        help="The database file to store the data",
    )

    args = parser.parse_args()

    print("Processing archive...")
    conditions = parse_archive(args.archive.name)
    print("Loading data into database...")
    loaded = load_database(args.database.name, conditions)
