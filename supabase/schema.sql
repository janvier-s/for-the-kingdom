-- Schema for kingdom-deliverance Bible data

CREATE TABLE public.languages (
  lang_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lang TEXT NOT NULL
);

CREATE TABLE public.testaments (
  testament_id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  lang_id BIGINT NULL, -- Changed to BIGINT to match languages.lang_id
  CONSTRAINT fk_testaments_lang FOREIGN KEY (lang_id) REFERENCES public.languages(lang_id) ON DELETE RESTRICT
);

CREATE TABLE public.types (
  type_id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  lang_id BIGINT NULL, -- Changed to BIGINT to match languages.lang_id
  CONSTRAINT fk_types_lang FOREIGN KEY (lang_id) REFERENCES public.languages(lang_id) ON DELETE RESTRICT
);

CREATE TABLE public.books (
  book_id SERIAL PRIMARY KEY,
  testament_id INTEGER NOT NULL,
  type_id INTEGER NOT NULL,
  abbr TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  bible_order SMALLINT NOT NULL CHECK (bible_order > 0),
  lang_id BIGINT NULL,  -- Changed to BIGINT to match languages.lang_id
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT books_testament_id_fkey FOREIGN KEY (testament_id) REFERENCES public.testaments(testament_id) ON DELETE RESTRICT,
  CONSTRAINT books_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.types(type_id) ON DELETE RESTRICT,
  CONSTRAINT fk_books_lang FOREIGN KEY (lang_id) REFERENCES public.languages(lang_id) ON DELETE RESTRICT
);

CREATE TABLE public.chapters (
  chapter_id SERIAL PRIMARY KEY,
  book_id INTEGER NOT NULL,
  chapter_number SMALLINT NOT NULL CHECK (chapter_number > 0),
  CONSTRAINT chapters_book_id_chapter_number_key UNIQUE (book_id, chapter_number),
  CONSTRAINT chapters_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(book_id) ON DELETE RESTRICT
);

CREATE TABLE public.versions (
  version_id SERIAL PRIMARY KEY,
  abbr TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  description TEXT NULL,
  lang_id BIGINT NULL, -- Changed to BIGINT to match languages.lang_id
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_versions_lang FOREIGN KEY (lang_id) REFERENCES public.languages(lang_id) ON DELETE RESTRICT
);

CREATE TABLE public.verses (
  verse_id BIGSERIAL PRIMARY KEY,
  chapter_id INTEGER NOT NULL,
  version_id INTEGER NOT NULL,
  verse_number SMALLINT NOT NULL CHECK (verse_number > 0),
  verse_text TEXT NOT NULL,
  lang_id BIGINT NULL,  -- Changed to BIGINT to match languages.lang_id
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT verses_chapter_id_version_id_verse_number_key UNIQUE (chapter_id, version_id, verse_number),
  CONSTRAINT fk_verses_lang FOREIGN KEY (lang_id) REFERENCES public.languages(lang_id) ON DELETE RESTRICT,
  CONSTRAINT verses_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapters(chapter_id) ON DELETE RESTRICT,
  CONSTRAINT verses_version_id_fkey FOREIGN KEY (version_id) REFERENCES public.versions(version_id) ON DELETE RESTRICT
);