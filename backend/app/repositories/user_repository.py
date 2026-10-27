from uuid import UUID
from typing import Optional, Union, List
from sqlalchemy.orm import Session, joinedload
from app.models.user import User
from app.models.user_preference import UserPreference


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: Union[UUID, str]) -> Optional[User]:
        """Fetch user entity by UUID with user preferences pre-loaded."""
        if isinstance(user_id, str):
            try:
                user_id = UUID(user_id)
            except (ValueError, TypeError):
                return None

        return (
            self.db.query(User)
            .options(joinedload(User.preference))
            .filter(User.id == user_id)
            .first()
        )

    def get_by_email(self, email: str) -> Optional[User]:
        """Fetch user entity by unique email address."""
        return (
            self.db.query(User)
            .options(joinedload(User.preference))
            .filter(User.email == email.lower())
            .first()
        )

    def create(self, user: User, default_preference: Optional[UserPreference] = None) -> User:
        """Persist new User and associated default UserPreference."""
        self.db.add(user)
        self.db.flush()
        
        if default_preference:
            default_preference.user_id = user.id
            self.db.add(default_preference)
            
        self.db.commit()
        self.db.refresh(user)
        return user

    def update_preference(self, preference: UserPreference) -> UserPreference:
        """Update existing UserPreference entity."""
        self.db.add(preference)
        self.db.commit()
        self.db.refresh(preference)
        return preference

    def update(self, user: User) -> User:
        """Update existing User entity."""
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def list_all(self, skip: int = 0, limit: int = 200) -> List[User]:
        """Fetch all user records for administrative oversight."""
        return (
            self.db.query(User)
            .options(joinedload(User.preference))
            .order_by(User.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
