from sqlalchemy import text

from app.database import engine


COLUMNS = {
    "artifact_name": "VARCHAR(255)",
    "collection_method": "VARCHAR(100)",
    "sha256_hash": "VARCHAR(64)",
    "integrity_status": "VARCHAR(30) DEFAULT 'unverified'",
    "review_status": "VARCHAR(30) DEFAULT 'pending'",
    "reviewed_by": "VARCHAR(255)",
    "reviewed_at": "TIMESTAMP",
}


def update_evidence_schema():
    print("Updating AEGIS evidence schema...")

    with engine.begin() as connection:
        existing_columns = {
            row[0]
            for row in connection.execute(
                text(
                    """
                    SELECT column_name
                    FROM information_schema.columns
                    WHERE table_name = 'evidence'
                    """
                )
            )
        }

        for column_name, column_type in COLUMNS.items():
            if column_name not in existing_columns:
                print(f"Adding column: {column_name}")
                connection.execute(
                    text(
                        f"""
                        ALTER TABLE evidence
                        ADD COLUMN {column_name} {column_type}
                        """
                    )
                )
            else:
                print(f"Already exists: {column_name}")

    print("Evidence schema update completed.")


if __name__ == "__main__":
    update_evidence_schema()