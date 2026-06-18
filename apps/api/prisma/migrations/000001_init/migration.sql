-- migrate:up
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TYPE user_type AS ENUM ('STUDENT', 'INDUSTRY', 'ADMIN');
CREATE TYPE otp_purpose AS ENUM ('EMAIL_VERIFY', 'PASSWORD_RESET');
CREATE TYPE verification_status AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');
CREATE TYPE consent_level AS ENUM ('PUBLIC', 'GATED', 'PRIVATE');
CREATE TYPE urgency AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE problem_status AS ENUM ('OPEN', 'MATCHED', 'CLOSED');
CREATE TYPE suggestion_trigger AS ENUM ('SCHOLAR_REGISTERED', 'PROBLEM_POSTED', 'WEEKLY_DIGEST');
CREATE TYPE topic_suggestion_status AS ENUM ('NEW', 'VIEWED', 'SAVED', 'DISMISSED');
CREATE TYPE problem_surfacing_status AS ENUM ('UNSEEN', 'VIEWED', 'INTERESTED');
CREATE TYPE match_status AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');
CREATE TYPE contact_request_status AS ENUM ('PENDING', 'APPROVED', 'DECLINED', 'EXPIRED');
CREATE TYPE plan_tier AS ENUM ('EXPLORER', 'PROFESSIONAL', 'ENTERPRISE');
CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED');

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  user_type user_type NOT NULL,
  is_verified boolean NOT NULL DEFAULT false,
  failed_login_attempts integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE refresh_tokens (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX refresh_tokens_user_id_idx ON refresh_tokens(user_id);

CREATE TABLE otp_tokens (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  purpose otp_purpose NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX otp_tokens_user_id_idx ON otp_tokens(user_id);

CREATE TABLE scholars (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  institution text NOT NULL,
  department text NOT NULL,
  graduation_year integer NOT NULL,
  discipline_focus text NOT NULL,
  bio text,
  supervisor_name text,
  verification_status verification_status NOT NULL DEFAULT 'PENDING',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX scholars_discipline_focus_idx ON scholars(discipline_focus);
CREATE INDEX scholars_graduation_year_idx ON scholars(graduation_year);

CREATE TABLE companies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  sector text NOT NULL,
  size text,
  website text,
  description text,
  contact_email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX companies_sector_idx ON companies(sector);

CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  scholar_id uuid NOT NULL REFERENCES scholars(id) ON DELETE CASCADE,
  title text NOT NULL,
  abstract text NOT NULL,
  full_text text,
  file_url text NOT NULL,
  discipline text NOT NULL,
  problem_domain text,
  methodology text,
  year integer NOT NULL,
  embedding vector(1536),
  consent_level consent_level NOT NULL DEFAULT 'PUBLIC',
  allows_contact boolean NOT NULL DEFAULT true,
  allows_commercial_use boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX projects_scholar_id_idx ON projects(scholar_id);
CREATE INDEX projects_discipline_idx ON projects(discipline);
CREATE INDEX projects_year_idx ON projects(year);
CREATE INDEX projects_is_published_idx ON projects(is_published);
CREATE INDEX projects_embedding_hnsw_idx ON projects USING hnsw (embedding vector_cosine_ops);

CREATE TABLE project_tags (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tag text NOT NULL,
  source text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX project_tags_project_id_idx ON project_tags(project_id);
CREATE INDEX project_tags_tag_idx ON project_tags(tag);

CREATE TABLE problems (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  sector text NOT NULL,
  skills_required text[] NOT NULL,
  urgency urgency NOT NULL DEFAULT 'MEDIUM',
  status problem_status NOT NULL DEFAULT 'OPEN',
  is_open_to_students boolean NOT NULL DEFAULT false,
  embedding vector(1536),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX problems_company_id_idx ON problems(company_id);
CREATE INDEX problems_sector_idx ON problems(sector);
CREATE INDEX problems_status_idx ON problems(status);
CREATE INDEX problems_is_open_to_students_idx ON problems(is_open_to_students);
CREATE INDEX problems_embedding_hnsw_idx ON problems USING hnsw (embedding vector_cosine_ops);

CREATE TABLE suggestion_batches (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  scholar_id uuid NOT NULL REFERENCES scholars(id) ON DELETE CASCADE,
  triggered_by suggestion_trigger NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX suggestion_batches_scholar_id_idx ON suggestion_batches(scholar_id);

CREATE TABLE topic_suggestions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id uuid NOT NULL REFERENCES suggestion_batches(id) ON DELETE CASCADE,
  scholar_id uuid NOT NULL REFERENCES scholars(id) ON DELETE CASCADE,
  related_problem_id uuid REFERENCES problems(id) ON DELETE SET NULL,
  title text NOT NULL,
  rationale text NOT NULL,
  discipline text NOT NULL,
  relevance_score numeric(5, 4) NOT NULL,
  topic_embedding vector(1536),
  status topic_suggestion_status NOT NULL DEFAULT 'NEW',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX topic_suggestions_batch_id_idx ON topic_suggestions(batch_id);
CREATE INDEX topic_suggestions_scholar_id_idx ON topic_suggestions(scholar_id);
CREATE INDEX topic_suggestions_related_problem_id_idx ON topic_suggestions(related_problem_id);
CREATE INDEX topic_suggestions_status_idx ON topic_suggestions(status);
CREATE INDEX topic_suggestions_topic_embedding_hnsw_idx ON topic_suggestions USING hnsw (topic_embedding vector_cosine_ops);

CREATE TABLE problem_surfacings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  scholar_id uuid NOT NULL REFERENCES scholars(id) ON DELETE CASCADE,
  problem_id uuid NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  relevance_score numeric(5, 4) NOT NULL,
  surfaced_at timestamptz NOT NULL DEFAULT now(),
  status problem_surfacing_status NOT NULL DEFAULT 'UNSEEN',
  CONSTRAINT problem_surfacings_scholar_id_problem_id_key UNIQUE (scholar_id, problem_id)
);
CREATE INDEX problem_surfacings_scholar_id_idx ON problem_surfacings(scholar_id);
CREATE INDEX problem_surfacings_problem_id_idx ON problem_surfacings(problem_id);
CREATE INDEX problem_surfacings_status_idx ON problem_surfacings(status);

CREATE TABLE matches (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  problem_id uuid NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  similarity_score numeric(6, 5) NOT NULL,
  explanation text NOT NULL,
  status match_status NOT NULL DEFAULT 'PENDING',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT matches_problem_id_project_id_key UNIQUE (problem_id, project_id)
);
CREATE INDEX matches_problem_id_idx ON matches(problem_id);
CREATE INDEX matches_project_id_idx ON matches(project_id);
CREATE INDEX matches_status_idx ON matches(status);

CREATE TABLE contact_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES companies(id),
  project_id uuid NOT NULL REFERENCES projects(id),
  scholar_id uuid NOT NULL REFERENCES scholars(id),
  message text NOT NULL,
  status contact_request_status NOT NULL DEFAULT 'PENDING',
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz
);
CREATE INDEX contact_requests_company_id_idx ON contact_requests(company_id);
CREATE INDEX contact_requests_project_id_idx ON contact_requests(project_id);
CREATE INDEX contact_requests_scholar_id_idx ON contact_requests(scholar_id);
CREATE INDEX contact_requests_status_idx ON contact_requests(status);

CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL UNIQUE REFERENCES companies(id),
  plan_tier plan_tier NOT NULL,
  paystack_subscription_id text,
  status subscription_status NOT NULL DEFAULT 'ACTIVE',
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX subscriptions_status_idx ON subscriptions(status);
