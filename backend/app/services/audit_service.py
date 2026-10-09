from uuid import UUID

from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def record_audit_event(
    db: Session,
    *,
    actor: str = "system",
    action: str,
    entity_type: str,
    entity_id: UUID | str | None = None,
    description: str,
    old_value: str | None = None,
    new_value: str | None = None,
    source: str = "system",
) -> AuditLog:
    """
    Record a platform-wide AEGIS audit event.

    Audit records are created by backend workflows and
    state-changing operations rather than directly by
    frontend clients.
    """

    audit_log = AuditLog(
        actor=actor,
        action=action,
        entity_type=entity_type,
        entity_id=(
            str(entity_id)
            if entity_id is not None
            else None
        ),
        description=description,
        old_value=old_value,
        new_value=new_value,
        source=source,
    )

    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)

    return audit_log