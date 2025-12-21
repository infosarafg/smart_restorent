--
-- PostgreSQL database dump
--

\restrict lyhrWtX7Ta9iTbDaqncwilzkRnBgUIZ3edGSrXupWvOMngiOl2hdqSXb0m52jn8

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.0

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

--
-- Name: meal_time_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.meal_time_enum AS ENUM (
    'Breakfast',
    'Lunch',
    'Dinner',
    'Always'
);


ALTER TYPE public.meal_time_enum OWNER TO postgres;

--
-- Name: meal_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.meal_type_enum AS ENUM (
    'Breakfast',
    'Lunch',
    'Dinner',
    'Always'
);


ALTER TYPE public.meal_type_enum OWNER TO postgres;

--
-- Name: order_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.order_status_enum AS ENUM (
    'pending',
    'preparing',
    'onway',
    'delivered',
    'canceled'
);


ALTER TYPE public.order_status_enum OWNER TO postgres;

--
-- Name: table_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.table_status_enum AS ENUM (
    'Available',
    'Reserved',
    'Occupied'
);


ALTER TYPE public.table_status_enum OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    customer_id integer NOT NULL,
    first_name character varying(50) NOT NULL,
    last_name character varying(50) NOT NULL,
    phone character varying(20),
    address character varying(255),
    email character varying(100),
    username character varying(50),
    password character varying(255) NOT NULL,
    age integer,
    health_condition character varying(50),
    profile_image_url character varying(255)
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- Name: customers_customer_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.customers_customer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customers_customer_id_seq OWNER TO postgres;

--
-- Name: customers_customer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.customers_customer_id_seq OWNED BY public.customers.customer_id;


--
-- Name: meal_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.meal_categories (
    category_id integer NOT NULL,
    category_name character varying(100) NOT NULL
);


ALTER TABLE public.meal_categories OWNER TO postgres;

--
-- Name: meal_categories_category_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.meal_categories_category_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.meal_categories_category_id_seq OWNER TO postgres;

--
-- Name: meal_categories_category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.meal_categories_category_id_seq OWNED BY public.meal_categories.category_id;


--
-- Name: meals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.meals (
    meal_id integer NOT NULL,
    category_id integer NOT NULL,
    meal_time public.meal_time_enum DEFAULT 'Always'::public.meal_time_enum,
    name character varying(100) NOT NULL,
    price numeric(10,2) NOT NULL,
    description text,
    image_url text
);


ALTER TABLE public.meals OWNER TO postgres;

--
-- Name: meals_meal_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.meals_meal_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.meals_meal_id_seq OWNER TO postgres;

--
-- Name: meals_meal_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.meals_meal_id_seq OWNED BY public.meals.meal_id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    order_id integer NOT NULL,
    customer_id integer NOT NULL,
    meal_id integer NOT NULL,
    quantity integer DEFAULT 1,
    price numeric(10,2) NOT NULL,
    status public.order_status_enum DEFAULT 'pending'::public.order_status_enum,
    order_datetime timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: orders_order_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orders_order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_order_id_seq OWNER TO postgres;

--
-- Name: orders_order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_order_id_seq OWNED BY public.orders.order_id;


--
-- Name: reservations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reservations (
    reservation_id integer NOT NULL,
    customer_id integer NOT NULL,
    table_id integer NOT NULL,
    reservation_datetime timestamp without time zone NOT NULL,
    notes text
);


ALTER TABLE public.reservations OWNER TO postgres;

--
-- Name: reservations_reservation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reservations_reservation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reservations_reservation_id_seq OWNER TO postgres;

--
-- Name: reservations_reservation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reservations_reservation_id_seq OWNED BY public.reservations.reservation_id;


--
-- Name: tables; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tables (
    table_id integer NOT NULL,
    table_number integer NOT NULL,
    capacity integer DEFAULT 4,
    location character varying(100),
    status public.table_status_enum DEFAULT 'Available'::public.table_status_enum
);


ALTER TABLE public.tables OWNER TO postgres;

--
-- Name: tables_table_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tables_table_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tables_table_id_seq OWNER TO postgres;

--
-- Name: tables_table_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tables_table_id_seq OWNED BY public.tables.table_id;


--
-- Name: customers customer_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers ALTER COLUMN customer_id SET DEFAULT nextval('public.customers_customer_id_seq'::regclass);


--
-- Name: meal_categories category_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meal_categories ALTER COLUMN category_id SET DEFAULT nextval('public.meal_categories_category_id_seq'::regclass);


--
-- Name: meals meal_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meals ALTER COLUMN meal_id SET DEFAULT nextval('public.meals_meal_id_seq'::regclass);


--
-- Name: orders order_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN order_id SET DEFAULT nextval('public.orders_order_id_seq'::regclass);


--
-- Name: reservations reservation_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservations ALTER COLUMN reservation_id SET DEFAULT nextval('public.reservations_reservation_id_seq'::regclass);


--
-- Name: tables table_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tables ALTER COLUMN table_id SET DEFAULT nextval('public.tables_table_id_seq'::regclass);


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customers (customer_id, first_name, last_name, phone, address, email, username, password, age, health_condition, profile_image_url) FROM stdin;
28	Sara	Azouz	0555123456	Alger	sara@example.com	sara123	123456	25	None	\N
29	Ali	Bensalem	0555987654	Oran	ali@example.com	ali456	password123	35	Hypertension	\N
30	Yasmine	Khaldi	0555234567	Algiers	Yasmine@example.com	yasmine99	pass123	10	None	\N
31	Ahmed	Ziani	0555765432	Blida	Ahmed@example.com	ahmed88	ahmedpass	65	Diabetic	\N
32	Meriem	Karim	0555123987	Algiers	meriem@example.com	meriem1	meriempass	12	None	\N
33	Omar	Fares	0555345678	Oran	omar@example.com	omar99	omarpass	45	Hypertension	\N
34	Leila	Salah	0555123678	Blida	leila@example.com	leila77	leilapass	28	None	\N
37	rehab	tt	13583..3333	alger	reh@gimail.com	tt	16	60	Diabetic	\N
35	Hassan	Amine	0555123999	oran	hassan@example.com	hassan88	hassanpass	60		Paleo_Grilled_Chicken_Cobb_Salad.jpg
\.


--
-- Data for Name: meal_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.meal_categories (category_id, category_name) FROM stdin;
1	Traditional
2	Fast Food
3	Healthy
4	Drinks
\.


--
-- Data for Name: meals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.meals (meal_id, category_id, meal_time, name, price, description, image_url) FROM stdin;
19	1	Lunch	كسكس تقليدي	7.00	كسكس بالخضار واللحم	/uploads/e551c79a-6c15-437d-8b4d-e35a412fa2fe.jpg
18	4	Always	قهوة بالحليب	2.00	مشروب متاح طوال اليوم	/uploads/2afd9c41-d0c5-4eb8-b15b-05ec04c464e0.jpg
17	3	Dinner	سلطة صحية	7.00	سلطة خفيفة بالعشاء	/uploads/8ad6f3da-5ae3-4f5d-8528-c4c623dea948.jpg
20	3	Lunch	عصير طبيعي	3.00	عصير فواكه طبيعي	/uploads/c48fb8e5-6afb-4564-94ff-0b8379d0e9ee.jpg
14	1	Always	كسرة تقليدية	5.00	كسرة بالزبدة والعسل	/uploads/21facded-93f4-4a18-b95d-65fd2c6c0959.jpg
16	2	Dinner	بيتزا مارجريتا	9.00	بيتزا إيطالية شهية    \r\nمكوّنات بيتزا مارغريتا هي:\r\n\r\nعجينة البيتزا\r\n\r\nصلصة الطماطم\r\n\r\nجبن الموزاريلا\r\n\r\nأوراق الريحان الطازجة\r\n\r\nزيت الزيتون\r\n\r\nملح (وأحيانًا قليل من الفلفل الأسود)\r\n\r\nهذه المكوّنات البسيطة هي سرّ نكهتها الكلاسيكية والمحبوبة 🍕	/uploads/08bbe109-4466-43e4-b050-536060165751.jpg
15	2	Lunch	برغر لحم	7.00	وجبة سريعة مع لحم وجودة عالية\r\nمكوّنات برجر اللحم هي:\r\n\r\nخبز البرجر\r\n\r\nلحم بقري مفروم (قطعة البرجر)\r\n\r\nجبن (اختياري)\r\n\r\nخس\r\n\r\nطماطم\r\n\r\nبصل\r\n\r\nصلصات (كاتشب، مايونيز، خردل حسب الرغبة)\r\n\r\nملح وفلفل لتتبيل اللحم\r\n\r\nيمكن إضافة مكوّنات أخرى حسب الذوق مثل الخيار المخلل أو البيض 🍔	/uploads/f030d6cf-d585-48ba-9016-ad080b5466cd.jpg
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (order_id, customer_id, meal_id, quantity, price, status, order_datetime) FROM stdin;
67	28	14	2	10.00	delivered	2025-12-17 02:53:00.073766
68	28	18	1	2.00	delivered	2025-12-17 02:53:00.073766
69	29	15	1	8.50	preparing	2025-12-17 02:53:00.073766
70	29	16	1	9.00	pending	2025-12-17 02:53:00.073766
71	30	14	1	5.00	delivered	2025-12-17 02:53:00.073766
72	30	20	1	3.00	delivered	2025-12-17 02:53:00.073766
73	31	17	1	7.00	delivered	2025-12-17 02:53:00.073766
74	31	18	1	2.00	pending	2025-12-17 02:53:00.073766
75	32	14	1	5.00	delivered	2025-12-17 02:53:00.073766
76	32	20	1	3.00	delivered	2025-12-17 02:53:00.073766
77	33	16	2	18.00	preparing	2025-12-17 02:53:00.073766
78	33	15	1	8.50	preparing	2025-12-17 02:53:00.073766
79	34	15	1	8.50	delivered	2025-12-17 02:53:00.073766
80	34	20	1	3.00	delivered	2025-12-17 02:53:00.073766
81	35	17	1	7.00	delivered	2025-12-17 02:53:00.073766
82	37	17	1	7.00	onway	2025-12-18 21:59:04.106305
84	35	19	1	7.00	pending	2025-12-19 12:20:38.139586
85	35	18	1	2.00	pending	2025-12-19 12:22:05.326724
86	35	20	1	3.00	pending	2025-12-19 12:22:41.318424
87	35	18	1	2.00	pending	2025-12-19 13:06:19.997035
88	35	18	6	12.00	pending	2025-12-19 13:12:11.38744
89	35	18	3	6.00	pending	2025-12-19 14:39:32.642032
90	35	19	3	21.00	pending	2025-12-19 14:39:32.916708
91	34	20	1	3.00	pending	2025-12-19 19:32:30.489198
\.


--
-- Data for Name: reservations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reservations (reservation_id, customer_id, table_id, reservation_datetime, notes) FROM stdin;
\.


--
-- Data for Name: tables; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tables (table_id, table_number, capacity, location, status) FROM stdin;
3	2	2	\N	Reserved
1	1	2	\N	Available
4	4	4	\N	Available
\.


--
-- Name: customers_customer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customers_customer_id_seq', 38, true);


--
-- Name: meal_categories_category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.meal_categories_category_id_seq', 4, true);


--
-- Name: meals_meal_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.meals_meal_id_seq', 20, true);


--
-- Name: orders_order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orders_order_id_seq', 95, true);


--
-- Name: reservations_reservation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reservations_reservation_id_seq', 1, false);


--
-- Name: tables_table_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tables_table_id_seq', 4, true);


--
-- Name: customers customers_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_email_key UNIQUE (email);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (customer_id);


--
-- Name: customers customers_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_username_key UNIQUE (username);


--
-- Name: meal_categories meal_categories_category_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meal_categories
    ADD CONSTRAINT meal_categories_category_name_key UNIQUE (category_name);


--
-- Name: meal_categories meal_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meal_categories
    ADD CONSTRAINT meal_categories_pkey PRIMARY KEY (category_id);


--
-- Name: meals meals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meals
    ADD CONSTRAINT meals_pkey PRIMARY KEY (meal_id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (order_id);


--
-- Name: reservations reservations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_pkey PRIMARY KEY (reservation_id);


--
-- Name: tables tables_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tables
    ADD CONSTRAINT tables_pkey PRIMARY KEY (table_id);


--
-- Name: tables tables_table_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tables
    ADD CONSTRAINT tables_table_number_key UNIQUE (table_number);


--
-- Name: meals meals_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meals
    ADD CONSTRAINT meals_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.meal_categories(category_id) ON DELETE RESTRICT;


--
-- Name: orders orders_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id) ON DELETE CASCADE;


--
-- Name: orders orders_meal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_meal_id_fkey FOREIGN KEY (meal_id) REFERENCES public.meals(meal_id) ON DELETE CASCADE;


--
-- Name: reservations reservations_table_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.tables(table_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict lyhrWtX7Ta9iTbDaqncwilzkRnBgUIZ3edGSrXupWvOMngiOl2hdqSXb0m52jn8

