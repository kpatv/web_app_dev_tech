--
-- PostgreSQL database dump
--

-- Dumped from database version 17.0
-- Dumped by pg_dump version 17.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: application; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.application (
    id uuid NOT NULL,
    address character varying NOT NULL,
    complexity numeric NOT NULL
);


ALTER TABLE public.application OWNER TO postgres;

--
-- Name: master; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.master (
    id uuid NOT NULL,
    fullname character varying NOT NULL,
    applications uuid[] DEFAULT '{}'::uuid[] NOT NULL
);


ALTER TABLE public.master OWNER TO postgres;

--
-- Data for Name: application; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.application (id, address, complexity) FROM stdin;
8c8fa7ac-4b65-4f71-b842-ad54473b8ed7	3	2
\.


--
-- Data for Name: master; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.master (id, fullname, applications) FROM stdin;
\.


--
-- Name: application application_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.application
    ADD CONSTRAINT application_pkey PRIMARY KEY (id);


--
-- Name: master master_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master
    ADD CONSTRAINT master_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

