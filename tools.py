#!/usr/bin/env python3

import json
import sqlite3
from pathlib import Path

import httpx

CCP_BASE_URL = "https://blockchain-gateway-stillness.live.tech.evefrontier.com"
ccp_client = httpx.Client(base_url=CCP_BASE_URL)
CARBON_ORE_ID = 77811


def item_search(item_types: dict[int, dict], item_name: str) -> list[str]:
    """
    Search for an item by string in the item name.
    """
    results = []
    for item_id, item in item_types.items():
        if item_name.lower() in item["name"].lower():
            results.append(f"{item['name']} ({item_id})")
    return results


def how_much_carbon(target_item_id: int) -> float:
    """
    Calculate the total amount of carbon (ID: 77811) needed to craft an item.
    This function handles multiple blueprints, recursive materials, and uses memoization
    """
    # Load crafting data once
    crafting = create_crafting_json("blueprint.db", "structure_names.json", "item_types.json")

    # Cache to store results and avoid recalculation
    cache: dict[int, float] = {}

    def _calculate_carbon(item_id: int) -> float:
        """
        Recursive helper function to calculate carbon needed for an item.
        """
        # Check cache first
        if item_id in cache:
            return cache[item_id]

        # If item is carbon itself, return 1
        if item_id == CARBON_ORE_ID:
            cache[item_id] = 1
            return 1

        # If item has no crafting recipe, it requires 0 carbon
        if item_id not in crafting:
            cache[item_id] = 0
            return 0

        blueprints = crafting[item_id]
        max_carbon = 0

        # Try each blueprint and find the one that uses the least carbon
        for blueprint in blueprints:
            total_carbon = 0.0

            # Sum carbon from all materials in this blueprint
            for material in blueprint["materials"]:
                material_id = int(material["typeID"])
                material_quantity = float(material["quantity"])

                # Recursively calculate carbon for this material
                carbon_per_unit = _calculate_carbon(material_id)
                print(f"Material Name: {material['name']}")
                print(f"Carbon per unit: {carbon_per_unit}")
                total_carbon += carbon_per_unit * material_quantity
                print(f"Total carbon: {total_carbon}")
                print()

            # Account for the number of items this blueprint produces
            product_count = blueprint.get("product_count", 1)
            carbon_per_product = total_carbon / product_count

            # Keep track of the highest cost blueprint
            max_carbon = max(max_carbon, carbon_per_product)

        # If no valid blueprint found, return 0
        result = 0 if max_carbon == 0 else float(max_carbon)
        cache[item_id] = result
        return result

    return _calculate_carbon(target_item_id)


def fetch_all_types() -> dict[int, dict]:
    """
    Fetch all item types from the CCP API and save to a JSON file.

    TODO: Handle pagination, right now there's enough items to fit in one request
    """
    item_types = {}
    result = ccp_client.get("/v2/types?limit=1000")

    for item in result.json()["data"]:
        try:
            item_types[int(item["id"])] = item
        except KeyError:
            print(f"KeyError: {item}")
            continue

    return item_types


def recipe_db_to_json(db_filename: str) -> list[dict]:
    """
    Convert the recipe database to a JSON file.
    """
    try:
        # Connect to the SQLite database
        conn = sqlite3.connect(db_filename)
        conn.row_factory = sqlite3.Row  # This allows us to access columns by name
        cursor = conn.cursor()

        # Query the indexes table for all rows
        cursor.execute("SELECT * FROM cache")
        rows = cursor.fetchall()

        # Convert rows to list of dictionaries
        result = []
        for row in rows:
            blueprint = dict(row)["value"]
            result.append(json.loads(blueprint))

        # Close the connection
        conn.close()

        return result

    except sqlite3.Error as e:
        print(f"SQLite error: {e}")
        return []
    except FileNotFoundError:
        print(f"Database file '{db_filename}' not found.")
        return []


def create_structure_lookup(
    item_types_filename: str, structure_names_filename: str,
) -> dict[int, list[str]]:
    """
    Create a lookup of recipe IDs to their structure IDs.
    TODO: include the process for getting the JSON data from gamefiles
    """
    structures = {}

    with Path(item_types_filename).open() as f:
        item_types = json.load(f)
    with Path(structure_names_filename).open() as f:
        structure_names = json.load(f)

    for structure_id, structure in item_types.items():
        for item_id in structure["includedTypeIDs"]:
            if item_id not in structures:
                structures[item_id] = [
                    structure_names[structure_id]["name"],
                ]
            else:
                structures[item_id].append(structure_names[structure_id]["name"])

    return structures


def create_crafting_json(
    db_filename: str, structure_names_filename: str, item_types_filename: str,
) -> dict[int, list[dict]]:
    """
    Combine the recipe database with the item types to create a crafting JSON file.
    """
    item_types = fetch_all_types()
    bps = recipe_db_to_json(db_filename)
    structure_lookup = create_structure_lookup(item_types_filename, structure_names_filename)
    product_lookup: dict[int, list[dict]] = {}

    for bp in bps:
        if bp["activities"] and bp["activities"]["manufacturing"]:
            product_results = bp["activities"]["manufacturing"]["products"]
            materials = bp["activities"]["manufacturing"]["materials"]
            time = bp["activities"]["manufacturing"]["time"]
            bp_id = int(bp["blueprintTypeID"])
            max_production = bp["maxProductionLimit"]

            # give the materials a human readable name
            for material in materials:
                material_id = int(material["typeID"])
                material_name = item_types.get(material_id, {}).get("name", "Unknown")
                material["name"] = material_name

            for product in product_results:
                product_id = product["typeID"]
                product_count = product["quantity"]
                product_name = item_types.get(product_id, {}).get("name", "Unknown")

                if product_id not in product_lookup:
                    product_lookup[int(product_id)] = []

                product_lookup[product_id].append(
                    {
                        "bp_id": bp_id,
                        "structures": structure_lookup.get(bp_id, []),
                        "materials": materials,
                        "time": time,
                        "max_production": max_production,
                        "product_count": product_count,
                        "product_name": product_name,
                    },
                )

    return product_lookup


if __name__ == "__main__":
    pass
