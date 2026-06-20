import asyncio
import uuid

from sqlalchemy import select

from app.config import settings
from app.core.auth import hash_api_key
from app.database import async_session
from app.models import Collection, Tenant


async def seed() -> None:
    async with async_session() as db:
        result = await db.execute(select(Tenant).limit(1))
        if result.scalar_one_or_none():
            print("Seed: tenant already exists")
            return

        tenant = Tenant(
            id=uuid.uuid4(),
            name="Default",
            api_key_hash=hash_api_key(settings.api_key),
            widget_key=settings.widget_key,
            site_url=settings.site_url,
            settings={},
        )
        db.add(tenant)
        await db.flush()

        collection = Collection(
            tenant_id=tenant.id,
            name="Default",
            slug="default",
            description="Default knowledge base",
        )
        db.add(collection)
        await db.commit()
        print(f"Seed: created tenant {tenant.id} and default collection")


def main() -> None:
    asyncio.run(seed())


if __name__ == "__main__":
    main()
