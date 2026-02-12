from src.db.database import Database

CREATE_MEETINGS_TABLE = """
CREATE TABLE IF NOT EXISTS meetings (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    status TEXT NOT NULL,
    started_at TEXT NOT NULL,
    ended_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
"""

CREATE_TRANSCRIPT_SEGMENTS_TABLE = """
CREATE TABLE IF NOT EXISTS transcript_segments (
    id TEXT PRIMARY KEY,
    meeting_id TEXT NOT NULL,
    speaker TEXT,
    text TEXT NOT NULL,
    started_at TEXT,
    ended_at TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
);
"""

CREATE_SNAPSHOTS_TABLE = """
CREATE TABLE IF NOT EXISTS snapshots (
    id TEXT PRIMARY KEY,
    meeting_id TEXT NOT NULL,
    summary TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
);
"""

CREATE_INSIGHTS_TABLE = """
CREATE TABLE IF NOT EXISTS insights (
    id TEXT PRIMARY KEY,
    meeting_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    content TEXT NOT NULL,
    owner TEXT,
    due_date TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
);
"""

CREATE_INDEX_STATEMENTS = [
    "CREATE INDEX IF NOT EXISTS idx_transcript_segments_meeting_id ON transcript_segments(meeting_id)",
    "CREATE INDEX IF NOT EXISTS idx_snapshots_meeting_id ON snapshots(meeting_id)",
    "CREATE INDEX IF NOT EXISTS idx_insights_meeting_id ON insights(meeting_id)",
]


async def apply_migrations(database: Database) -> None:
    async with database.connection() as conn:
        await conn.execute("PRAGMA foreign_keys = ON;")
        await conn.execute(CREATE_MEETINGS_TABLE)
        await conn.execute(CREATE_TRANSCRIPT_SEGMENTS_TABLE)
        await conn.execute(CREATE_SNAPSHOTS_TABLE)
        await conn.execute(CREATE_INSIGHTS_TABLE)
        for statement in CREATE_INDEX_STATEMENTS:
            await conn.execute(statement)
