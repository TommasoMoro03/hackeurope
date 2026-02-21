from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8001

    # Database Configuration (shared with backend)
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432

    @property
    def database_url(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # Environment
    DEBUG: bool = True
    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


settings = Settings()
