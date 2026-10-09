from sqlalchemy import text

from app.database import engine


with engine.begin() as connection:
    connection.execute(
        text(
            """
            ALTER TABLE evidence
            ADD COLUMN IF NOT EXISTS artifact_path VARCHAR(500)
            """
        )
    )

print("Evidence artifact_path column added successfully.")