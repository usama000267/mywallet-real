--
-- PostgreSQL database dump
--

\restrict V6J0KzSyCgyCPfXwOHmK93kvs4g90H1OzrkLY9ZFNbwHL0VmtztdhHjpIJULXWb

-- Dumped from database version 18.6 (Debian 18.6-1.pgdg12+2)
-- Dumped by pg_dump version 18.6

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: deposits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deposits (
    id integer NOT NULL,
    user_id integer NOT NULL,
    amount numeric NOT NULL,
    network text NOT NULL,
    tx_hash text,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: deposits_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.deposits_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: deposits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.deposits_id_seq OWNED BY public.deposits.id;


--
-- Name: earnings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.earnings (
    id integer NOT NULL,
    user_id integer NOT NULL,
    type text NOT NULL,
    source_id integer,
    description text,
    amount numeric DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: earnings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.earnings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: earnings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.earnings_id_seq OWNED BY public.earnings.id;


--
-- Name: email_otps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_otps (
    id integer NOT NULL,
    user_id integer,
    email text NOT NULL,
    purpose text NOT NULL,
    otp_hash text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    resend_available_at timestamp without time zone NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    used boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: email_otps_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.email_otps_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: email_otps_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.email_otps_id_seq OWNED BY public.email_otps.id;


--
-- Name: landing_nfts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.landing_nfts (
    id integer NOT NULL,
    name text NOT NULL,
    image_url text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: landing_nfts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.landing_nfts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: landing_nfts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.landing_nfts_id_seq OWNED BY public.landing_nfts.id;


--
-- Name: nft_sales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nft_sales (
    id integer NOT NULL,
    user_nft_id integer NOT NULL,
    user_id integer NOT NULL,
    purchase_price numeric DEFAULT 0 NOT NULL,
    sale_price numeric DEFAULT 0 NOT NULL,
    profit_amount numeric DEFAULT 0 NOT NULL,
    status text DEFAULT 'completed'::text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: nft_sales_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.nft_sales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: nft_sales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.nft_sales_id_seq OWNED BY public.nft_sales.id;


--
-- Name: nfts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nfts (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    image_url text,
    price numeric DEFAULT 0 NOT NULL,
    profit_percent numeric DEFAULT 0 NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: nfts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.nfts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: nfts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.nfts_id_seq OWNED BY public.nfts.id;


--
-- Name: referral_bonuses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.referral_bonuses (
    id integer NOT NULL,
    referrer_id integer NOT NULL,
    referred_user_id integer NOT NULL,
    deposit_id integer NOT NULL,
    deposit_amount numeric NOT NULL,
    bonus_percent numeric DEFAULT 10 NOT NULL,
    bonus_amount numeric NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: referral_bonuses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.referral_bonuses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: referral_bonuses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.referral_bonuses_id_seq OWNED BY public.referral_bonuses.id;


--
-- Name: reservations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reservations (
    id integer NOT NULL,
    user_id integer NOT NULL,
    balance_before numeric NOT NULL,
    profit_percent numeric NOT NULL,
    profit_amount numeric NOT NULL,
    balance_after numeric NOT NULL,
    status text DEFAULT 'completed'::text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: reservations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reservations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reservations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reservations_id_seq OWNED BY public.reservations.id;


--
-- Name: site_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_settings (
    id integer NOT NULL,
    setting_key text NOT NULL,
    setting_value text DEFAULT ''::text NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: site_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.site_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: site_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.site_settings_id_seq OWNED BY public.site_settings.id;


--
-- Name: user_nfts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_nfts (
    id integer NOT NULL,
    user_id integer NOT NULL,
    nft_id integer NOT NULL,
    purchase_price numeric DEFAULT 0 NOT NULL,
    expected_profit_percent numeric DEFAULT 0 NOT NULL,
    expected_profit_amount numeric DEFAULT 0 NOT NULL,
    purchase_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    sold_at timestamp without time zone,
    sale_price numeric,
    profit_amount numeric,
    status text DEFAULT 'owned'::text NOT NULL
);


--
-- Name: user_nfts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_nfts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_nfts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_nfts_id_seq OWNED BY public.user_nfts.id;


--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_sessions (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    balance numeric DEFAULT 0 NOT NULL,
    referral_code text,
    referred_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_blocked boolean DEFAULT false NOT NULL
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: withdrawals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.withdrawals (
    id integer NOT NULL,
    user_id integer NOT NULL,
    amount numeric NOT NULL,
    network text NOT NULL,
    wallet_address text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: withdrawals_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.withdrawals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: withdrawals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.withdrawals_id_seq OWNED BY public.withdrawals.id;


--
-- Name: deposits id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deposits ALTER COLUMN id SET DEFAULT nextval('public.deposits_id_seq'::regclass);


--
-- Name: earnings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.earnings ALTER COLUMN id SET DEFAULT nextval('public.earnings_id_seq'::regclass);


--
-- Name: email_otps id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_otps ALTER COLUMN id SET DEFAULT nextval('public.email_otps_id_seq'::regclass);


--
-- Name: landing_nfts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.landing_nfts ALTER COLUMN id SET DEFAULT nextval('public.landing_nfts_id_seq'::regclass);


--
-- Name: nft_sales id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nft_sales ALTER COLUMN id SET DEFAULT nextval('public.nft_sales_id_seq'::regclass);


--
-- Name: nfts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nfts ALTER COLUMN id SET DEFAULT nextval('public.nfts_id_seq'::regclass);


--
-- Name: referral_bonuses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_bonuses ALTER COLUMN id SET DEFAULT nextval('public.referral_bonuses_id_seq'::regclass);


--
-- Name: reservations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservations ALTER COLUMN id SET DEFAULT nextval('public.reservations_id_seq'::regclass);


--
-- Name: site_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_settings ALTER COLUMN id SET DEFAULT nextval('public.site_settings_id_seq'::regclass);


--
-- Name: user_nfts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_nfts ALTER COLUMN id SET DEFAULT nextval('public.user_nfts_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: withdrawals id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.withdrawals ALTER COLUMN id SET DEFAULT nextval('public.withdrawals_id_seq'::regclass);


--
-- Data for Name: deposits; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.deposits (id, user_id, amount, network, tx_hash, status, created_at) FROM stdin;
1	1	900	TRC20	yyyyyyyyyyyyyyyyy	rejected	2026-08-30 09:13:27.603766
2	1	10	BEP20	Google	approved	2026-08-30 11:00:49.576612
3	2	1000	BEP20	mbshsjiuhgggygg6862	approved	2026-08-30 15:54:06.134554
4	4	100	BEP20	402370671049	approved	2026-09-08 19:22:30.249076
5	5	100	BEP20	38481837361	approved	2026-09-12 05:03:13.324332
6	7	100	BEP20	402436579556	approved	2026-09-18 06:51:25.497372
7	8	200	BEP20	300148657052	approved	2026-09-18 14:28:15.238212
8	14	30	BEP20	28391039361	approved	2026-09-22 07:42:42.382619
\.


--
-- Data for Name: earnings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.earnings (id, user_id, type, source_id, description, amount, created_at) FROM stdin;
1	2	nft_profit	1	NFT profit - Mr.Bush (2.2%)	24.2	2026-09-16 18:39:18.111357
2	4	nft_profit	2	NFT profit - candy cloud (2.1%)	1.197	2026-09-17 04:51:45.106922
3	4	nft_profit	3	NFT profit - Tiny Teddy (2.1%)	2.31	2026-09-18 02:42:07.832705
4	2	referral_bonus	6	Team referral bonus	10	2026-09-18 06:53:13.131325
5	7	nft_profit	4	NFT profit - chubby pengion (2.1%)	2.1	2026-09-18 06:57:53.034609
6	4	referral_bonus	7	Team referral bonus	20	2026-09-18 14:32:43.689989
7	2	nft_profit	5	NFT profit - Tony King (2.2%)	25.3	2026-09-18 14:35:09.838674
8	8	nft_profit	6	NFT profit - Pinkey Boo (2.1%)	4.2	2026-09-18 14:36:43.665445
9	4	nft_profit	7	NFT profit - chubby pengion (2.1%)	2.1	2026-09-19 01:52:47.535726
10	8	nft_profit	8	NFT profit - Pinkey Boo (2.1%)	4.2	2026-09-19 01:53:34.789028
11	2	nft_profit	9	NFT profit - Tony King (2.2%)	25.3	2026-09-19 06:28:10.584974
12	5	nft_profit	10	NFT profit - Golden puppy (2.1%)	2.1	2026-09-19 06:42:17.130648
13	7	nft_profit	11	NFT profit - Moon Light (2.1%)	2.142	2026-09-19 07:10:19.471765
14	4	nft_profit	12	NFT profit - chubby pengion (2.1%)	2.1	2026-09-20 01:48:53.85135
15	8	nft_profit	13	NFT profit - Pinkey Boo (2.1%)	4.2	2026-09-20 01:49:43.758142
16	7	nft_profit	14	NFT profit - Commando NFT (2.1%)	2.184	2026-09-20 07:35:30.706147
17	2	nft_profit	15	NFT profit - Tony King (2.2%)	25.3	2026-09-20 16:20:17.836162
18	4	activity_bonus	\N	\N	36.93	2026-09-20 16:26:29.896956
19	4	nft_profit	16	NFT profit - Glaxy NFT (2.1%)	2.919	2026-09-21 01:54:59.624753
20	8	nft_profit	17	NFT profit - Pinkey Boo (2.1%)	4.2	2026-09-21 01:55:34.220674
21	5	nft_profit	18	NFT profit - Golden nft (2.1%)	2.163	2026-09-21 02:21:33.456402
22	2	nft_profit	19	NFT profit - Tony King (2.2%)	25.3	2026-09-21 06:45:31.712855
23	7	nft_profit	20	NFT profit - Arrow Mercury (2.1%)	2.205	2026-09-21 07:38:14.753675
24	5	nft_profit	21	NFT profit - velvet vibes (2.1%)	2.268	2026-09-22 04:19:31.511538
25	8	nft_profit	22	NFT profit - Pinkey Boo (2.1%)	4.2	2026-09-22 05:01:18.467686
26	4	nft_profit	23	NFT profit - Sun Roof (2.1%)	2.961	2026-09-22 05:02:02.403788
27	2	nft_profit	24	NFT profit - Rocky Bull (2.3%)	27.6	2026-09-22 05:33:11.562231
28	7	nft_profit	25	NFT profit - Rainbox NFT (2.1%)	2.268	2026-09-22 07:41:08.885369
29	2	referral_bonus	8	Team referral bonus	3	2026-09-22 07:43:21.477057
30	14	nft_profit	26	NFT profit - Golden puppy god (2.1%)	0.63	2026-09-22 07:55:14.224754
31	14	nft_profit	27	NFT profit - Golden nft (1.9%)	0.57	2026-09-23 02:55:28.608378
32	8	nft_profit	28	NFT profit - Tiny Star (2.2%)	4.62	2026-09-23 05:03:47.783298
33	4	nft_profit	29	NFT profit - Golden puppy (2.1%)	3.024	2026-09-23 05:04:30.179658
34	7	nft_profit	30	NFT profit - Tiny Teddy (2.1%)	2.31	2026-09-23 07:44:58.823511
35	2	nft_profit	31	NFT profit - Rocky Bull (2.3%)	27.6	2026-09-23 10:21:14.736721
36	8	nft_profit	32	NFT profit - Tiny Star (2.2%)	4.62	2026-09-24 04:26:23.881082
37	4	nft_profit	33	NFT profit - Sun Light 3421 (2.1%)	3.066	2026-09-24 04:26:57.321498
38	7	nft_profit	34	NFT profit - Lucky Nft34343 (2.1%)	2.352	2026-09-24 07:47:23.298802
39	14	nft_profit	35	NFT profit - Golden puppy god (2.1%)	0.63	2026-09-24 08:19:14.505062
40	2	nft_profit	36	NFT profit - Platinium Nft (2.3%)	28.75	2026-09-24 08:30:11.960444
\.


--
-- Data for Name: email_otps; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.email_otps (id, user_id, email, purpose, otp_hash, expires_at, resend_available_at, attempts, used, created_at) FROM stdin;
1	\N	usamakingg683@gmail.com	registration	21e814cbfe08a6f115f7e13a48178bcd8485b828b01da643a52be79b5cbe9c5b	2026-09-18 06:53:41.031	2026-09-18 06:44:41.031	0	f	2026-09-18 06:43:41.03222
2	\N	noori4052017@gmail.com	registration	59c7210a81d376be4cfc0fb60ba3add1272cd2a7d77ea62406e643285336756d	2026-09-18 06:54:16.689	2026-09-18 06:45:16.689	0	t	2026-09-18 06:44:16.68969
3	\N	minety017@gmail.com	registration	8117003483cba5cd8dbecb0be2058cf1fa836edc4580994c572bd8446e0575a9	2026-09-18 07:04:00.259	2026-09-18 06:55:00.259	0	t	2026-09-18 06:54:00.260003
4	\N	rumair2023@gmail.com	registration	4fd78457c7b67770f42c511a63b229c9552b9a8c17a51579f1eb88176b343982	2026-09-18 12:14:57.827	2026-09-18 12:05:57.827	0	t	2026-09-18 12:04:57.827545
5	4	kanwalshaheen7304142@gmail.com	withdrawal	f8396b8244358ff1c0ba5e99edc13323bec54ef2123921734cec60582d83b214	2026-09-18 15:38:20.597	2026-09-18 15:29:20.597	0	t	2026-09-18 15:28:20.643879
6	\N	akhlaqqureshi8@gmail.com	registration	783b409bd60f716784827b92b439af5cc963ad45516c9f390e6d9a7a794b4d51	2026-09-18 15:50:33.744	2026-09-18 15:41:33.744	0	f	2026-09-18 15:40:33.744979
7	\N	akhlaqhussainqureshi8@gmail.com	registration	03298c7c98a34343d4ac3dc393e15403da9980900121f3c39266b3088668da5d	2026-09-18 15:56:00.672	2026-09-18 15:47:00.672	0	t	2026-09-18 15:46:00.67232
8	\N	akhlaqhussainqureshi8@gmail.com	registration	e8a239e64015b10fcedbff8db32d655344689f45d280b40860b8ee1151c03ab8	2026-09-18 15:58:09.934	2026-09-18 15:49:09.934	0	t	2026-09-18 15:48:09.934848
9	\N	mshafiqg7477@gmail.com	registration	fe4f21bedbfad4b04de1d83cab92da2b255bd8c8f41258fd8c5e6c766c1800d8	2026-09-18 17:49:41.607	2026-09-18 17:40:41.607	0	t	2026-09-18 17:39:41.605862
20	\N	nouraizmalik03@gmail.com	registration	e4154316a48b9248316b5df8d78c0cbcadda4d2f0ea0d494fcc9b4f72389ab90	2026-09-21 05:40:51.311	2026-09-21 05:31:51.311	1	t	2026-09-21 05:30:51.311634
29	\N	liaqatabbas005@gmail.com	registration	78a5e820ee88170a8d3a79cf0ff16b837a0c763cbc2d6773bb17e1cb41a7f3ed	2026-09-22 16:13:37.085	2026-09-22 16:04:37.085	0	t	2026-09-22 16:03:37.086022
10	\N	mshafiqg7477@gmail.com	registration	3cdb232a9b56aead00dcba8e06ed4ed013811dbdd9f473f324071f6ba18f1196	2026-09-18 18:09:27.55	2026-09-18 18:00:27.55	5	t	2026-09-18 17:59:27.547654
11	\N	mshafiqg7477@gmail.com	registration	988aea94854977c855e7f89a793a4945d728882a28ed395f821d6e7b9db5945d	2026-09-18 18:10:56.155	2026-09-18 18:01:56.155	0	t	2026-09-18 18:00:56.153433
12	\N	zohaibsahil1997@gmail.com	registration	eaa6ca6f6ef4ef70a482507f011eb339a69351bc18bdcd84e5df66d711232d54	2026-09-18 18:19:43.149	2026-09-18 18:10:43.149	0	t	2026-09-18 18:09:43.147619
13	\N	rajasaifali4444@gmail.com	registration	44b713d238f8e209d8e042b2ff8d56aeb0b607f0d2ce32181836a588f160aec2	2026-09-18 23:15:42.554	2026-09-18 23:06:42.554	0	t	2026-09-18 23:05:42.554905
14	4	kanwalshaheen7304142@gmail.com	withdrawal	dee3311c3925d921c6dc04c65f11f68f2a57061efb1d1778c93bea1a1a6e8af9	2026-09-19 11:42:27.991	2026-09-19 11:33:27.991	0	t	2026-09-19 11:32:27.990495
15	8	minety017@gmail.com	withdrawal	34da596606b6bdef4a7efeb278d94db3d75d4c4556e9bac146a7c48207317ebb	2026-09-19 13:31:16.515	2026-09-19 13:22:16.515	0	t	2026-09-19 13:21:16.516157
16	2	usamakingg034@gmail.com	withdrawal	6ea68f148ec26af44edbfb1f218c1630698c498cb9323574489ce9df8fb5490b	2026-09-19 16:48:40.285	2026-09-19 16:39:40.285	0	t	2026-09-19 16:38:40.28553
17	\N	nouraizmalik03@gmail.com	registration	7a04691085c6ef1d30112ca0906c63dfc64051168776b7566bbf85d5b7b28764	2026-09-21 05:30:57.483	2026-09-21 05:21:57.483	0	t	2026-09-21 05:20:57.483552
18	\N	nouraizmalik03@gmail.com	registration	311a9b496964701cbf2f491140d0550caf714750dc1ecb2ba4a5f833df0c9097	2026-09-21 05:32:29.292	2026-09-21 05:23:29.292	0	t	2026-09-21 05:22:29.292982
21	\N	nouraizmalik03@gmail.com	registration	2b80f8ce87c5a9a8cfc4b36c22d9e15215e699815d35122979b3b0ba36d0fcf2	2026-09-21 05:42:49.032	2026-09-21 05:33:49.032	2	t	2026-09-21 05:32:49.032718
19	\N	nouraizmalik03@gmail.com	registration	2b4b6751db9361d5e9c1c8822baea545b1cb22eefd9938134c992853a85cdd96	2026-09-21 05:39:26.416	2026-09-21 05:30:26.416	2	t	2026-09-21 05:29:26.416554
30	\N	eman.fatima4t8@gmail.com	registration	b6370d3a5f3564a5741cc860f5bee326b6ef8c0bd823ac7f988001178222195f	2026-09-24 06:38:14.564	2026-09-24 06:29:14.564	0	t	2026-09-24 06:28:14.56505
22	\N	nouraizmalik03@gmail.com	registration	e2ed404cce4f181179ec256f1168d325b7ac26a88a86e9d4cfa1ec57a8ae47ba	2026-09-21 05:45:32.828	2026-09-21 05:36:32.828	1	t	2026-09-21 05:35:32.829238
23	\N	nouraizmalik03@gmail.com	registration	6a0ae971df6dc77bde8ffac173de904b7b33307ca90ed81036a210d51890b3f9	2026-09-21 06:07:25.197	2026-09-21 05:58:25.197	0	t	2026-09-21 05:57:25.198295
24	\N	veerzad.007@gmail.com	registration	479e97898c351aa0822b895685061d523a456ae79f13eb2a39d02d3df1e9b3f9	2026-09-21 09:38:32.456	2026-09-21 09:29:32.456	0	t	2026-09-21 09:28:32.45724
25	\N	veerzad.007@gmail.com	registration	7d58cbf3a2cb6530dadb43d988e7af01f9351723c2e19af8facf8834e8e905e5	2026-09-21 09:40:16.086	2026-09-21 09:31:16.086	1	t	2026-09-21 09:30:16.086548
26	15	veerzad.007@gmail.com	withdrawal	db7a23b2df2fd9c5d8c6f512a92d9dd36399955986c79db12247a8bfdabfd626	2026-09-21 09:44:49.736	2026-09-21 09:35:49.736	0	f	2026-09-21 09:34:49.736688
27	\N	sardarmumtaz561@gmail.com	registration	44ce37504ef477201f891fd5ce714cd6f9dc421014e7e6600a8f1cb5d34f9e73	2026-09-21 13:54:51.814	2026-09-21 13:45:51.814	0	t	2026-09-21 13:44:51.814776
28	\N	f40893083@gmail.com	registration	66a1ef6d21c2682e6d1c22755f3db0e304684e015f69024431611cdfecb865a9	2026-09-22 13:09:47.96	2026-09-22 13:00:47.96	0	t	2026-09-22 12:59:47.960509
31	\N	waqasimalik322@gmail.com	registration	1c0489d003d4770edb611ed22b18fa17d584828ad41b8c32cb298a4df834ef63	2026-09-24 10:28:32.834	2026-09-24 10:19:32.834	0	t	2026-09-24 10:18:32.83521
32	\N	malikshahzaib1157368@gmail.com	registration	c43d0903508b37e2e66fb1d5ca46e2ebccda7e16415769a0a65ced19d54e302c	2026-09-24 10:40:20.376	2026-09-24 10:31:20.376	0	t	2026-09-24 10:30:20.377108
33	\N	haiderfaheem635@gmail.com	registration	601ce858c400a14279f4f50fd41ced9e759a55ea2c3558f3812ba3b754b0d95f	2026-09-24 17:53:11.111	2026-09-24 17:44:11.111	0	t	2026-09-24 17:43:11.111695
\.


--
-- Data for Name: landing_nfts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.landing_nfts (id, name, image_url, created_at) FROM stdin;
1	Golden NFT	https://res.cloudinary.com/wxcmwjru/image/upload/v1789921684/meta-nft/landing/ppih33jxplmwnkwfjq0v.jpg	2026-09-20 16:28:05.245773
2	Silver NFT	https://res.cloudinary.com/wxcmwjru/image/upload/v1789921760/meta-nft/landing/wbr6j45knazljmrbdytu.jpg	2026-09-20 16:29:20.830162
3	Meta GOLD	https://res.cloudinary.com/wxcmwjru/image/upload/v1789921790/meta-nft/landing/yuzm0d3kqpv87egdql0k.jpg	2026-09-20 16:29:50.916531
\.


--
-- Data for Name: nft_sales; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.nft_sales (id, user_nft_id, user_id, purchase_price, sale_price, profit_amount, status, created_at) FROM stdin;
1	1	2	1100	1124.2	24.2	completed	2026-09-16 18:39:18.111357
2	2	4	57	58.197	1.197	completed	2026-09-17 04:51:45.106922
3	3	4	110	112.31	2.31	completed	2026-09-18 02:42:07.832705
4	4	7	100	102.1	2.1	completed	2026-09-18 06:57:53.034609
5	5	2	1150	1175.3	25.3	completed	2026-09-18 14:35:09.838674
6	6	8	200	204.2	4.2	completed	2026-09-18 14:36:43.665445
7	7	4	100	102.1	2.1	completed	2026-09-19 01:52:47.535726
8	8	8	200	204.2	4.2	completed	2026-09-19 01:53:34.789028
9	9	2	1150	1175.3	25.3	completed	2026-09-19 06:28:10.584974
10	10	5	100	102.1	2.1	completed	2026-09-19 06:42:17.130648
11	11	7	102	104.142	2.142	completed	2026-09-19 07:10:19.471765
12	12	4	100	102.1	2.1	completed	2026-09-20 01:48:53.85135
13	13	8	200	204.2	4.2	completed	2026-09-20 01:49:43.758142
14	14	7	104	106.184	2.184	completed	2026-09-20 07:35:30.706147
15	15	2	1150	1175.3	25.3	completed	2026-09-20 16:20:17.836162
16	16	4	139	141.919	2.919	completed	2026-09-21 01:54:59.624753
17	17	8	200	204.2	4.2	completed	2026-09-21 01:55:34.220674
18	18	5	103	105.163	2.163	completed	2026-09-21 02:21:33.456402
19	19	2	1150	1175.3	25.3	completed	2026-09-21 06:45:31.712855
20	20	7	105	107.205	2.205	completed	2026-09-21 07:38:14.753675
21	21	5	108	110.268	2.268	completed	2026-09-22 04:19:31.511538
22	22	8	200	204.2	4.2	completed	2026-09-22 05:01:18.467686
23	23	4	141	143.961	2.961	completed	2026-09-22 05:02:02.403788
24	24	2	1200	1227.6	27.6	completed	2026-09-22 05:33:11.562231
25	25	7	108	110.268	2.268	completed	2026-09-22 07:41:08.885369
26	26	14	30	30.63	0.63	completed	2026-09-22 07:55:14.224754
27	27	14	30	30.57	0.57	completed	2026-09-23 02:55:28.608378
28	28	8	210	214.62	4.62	completed	2026-09-23 05:03:47.783298
29	29	4	144	147.024	3.024	completed	2026-09-23 05:04:30.179658
30	30	7	110	112.31	2.31	completed	2026-09-23 07:44:58.823511
31	31	2	1200	1227.6	27.6	completed	2026-09-23 10:21:14.736721
32	32	8	210	214.62	4.62	completed	2026-09-24 04:26:23.881082
33	33	4	146	149.066	3.066	completed	2026-09-24 04:26:57.321498
34	34	7	112	114.352	2.352	completed	2026-09-24 07:47:23.298802
35	35	14	30	30.63	0.63	completed	2026-09-24 08:19:14.505062
36	36	2	1250	1278.75	28.75	completed	2026-09-24 08:30:11.960444
\.


--
-- Data for Name: nfts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.nfts (id, name, description, image_url, price, profit_percent, status, created_at) FROM stdin;
62	Lazy NFT	listed on binance	https://res.cloudinary.com/wxcmwjru/image/upload/v1789727380/meta-nft/oe68sdhfqacdnorqo0wl.jpg	560	2.2	active	2026-09-16 09:15:46.05223
61	Big Boss	listed on kyc	https://res.cloudinary.com/wxcmwjru/image/upload/v1789727383/meta-nft/sa6j2thzgjsu3o7hzizh.jpg	540	2.2	active	2026-09-16 09:15:15.788796
59	Golden puppy	listed on bitget marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789727398/meta-nft/vk14kqotvolh7g34a0pq.jpg	510	2.2	active	2026-09-16 09:14:17.804018
58	Princess Pop	listed on binance	https://res.cloudinary.com/wxcmwjru/image/upload/v1789727402/meta-nft/pm4egt9w4ttsgherpjan.jpg	500	2.2	active	2026-09-16 08:45:02.376983
56	Heart Pop	listed on binance	https://res.cloudinary.com/wxcmwjru/image/upload/v1789727416/meta-nft/iys3zcv5z59srlrejcrd.png	460	2.2	active	2026-09-16 08:43:02.564725
55	MOON POP	listed on open sea	https://res.cloudinary.com/wxcmwjru/image/upload/v1789727434/meta-nft/bkkjlujgjbozsapxmmry.jpg	260	2.2	active	2026-09-16 08:41:52.748044
53	black rock	listed on okx	https://res.cloudinary.com/wxcmwjru/image/upload/v1789731474/meta-nft/kaiejdvv67wii9hepq0i.jpg	440	2.2	active	2026-09-16 08:40:17.551844
52	Lucky Nft	listed on open sea	https://res.cloudinary.com/wxcmwjru/image/upload/v1789731479/meta-nft/moiglfkhmpvkazqvpqi4.jpg	420	2.2	active	2026-09-16 08:39:55.82883
50	velvet vibes 3	listed on okx	https://res.cloudinary.com/wxcmwjru/image/upload/v1789731492/meta-nft/qnoagknx94ybseohvt7e.jpg	390	2.2	active	2026-09-16 08:26:52.243904
49	Rocky dawn	listed on open Sea	https://res.cloudinary.com/wxcmwjru/image/upload/v1789731497/meta-nft/prkysx86yepujtwzg49p.jpg	380	2.2	active	2026-09-16 08:26:16.056897
46	Rabbit King	listed on opensea	https://res.cloudinary.com/wxcmwjru/image/upload/v1789731548/meta-nft/clgizcz6qir5ie8bwe1a.jpg	350	2.2	active	2026-09-16 08:22:38.643891
44	silver puppy	listed on nft marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789731556/meta-nft/u9sy1kxbxq0mxx6y0un0.jpg	330	2.2	active	2026-09-16 08:21:44.404722
43	BLUE buddy	listed on okx	https://res.cloudinary.com/wxcmwjru/image/upload/v1789731562/meta-nft/o6zwmr4prl0umy2gubrl.webp	320	2.2	active	2026-09-16 08:19:49.239211
47	velvet vibes 2	listed on okx	https://res.cloudinary.com/wxcmwjru/image/upload/v1789731542/meta-nft/mj5amov4yo4ugkemrxtu.webp	360	2.3	active	2026-09-16 08:24:08.366144
41	Rose BUD	listed on Binance	https://res.cloudinary.com/wxcmwjru/image/upload/v1789731569/meta-nft/d9ncmmsz74hjuutkoc74.jpg	300	2.2	active	2026-09-16 08:18:22.025897
40	Snow Kitty	listed on open sea marketplae	https://res.cloudinary.com/wxcmwjru/image/upload/v1789731573/meta-nft/mqz5wombyk9tw0gj60hj.jpg	290	2.2	active	2026-09-16 08:17:52.829234
38	Love Bug	listed on nft marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789731587/meta-nft/xiqbzpw0ykzasl2e5th4.jpg	270	2.2	active	2026-09-16 08:16:44.699394
37	moon baby	listed on okx	https://res.cloudinary.com/wxcmwjru/image/upload/v1789731590/meta-nft/hpe51amkgpgsehacvznf.jpg	260	2.2	active	2026-09-16 08:16:09.939047
35	Cozy Cat	listed on okx	https://res.cloudinary.com/wxcmwjru/image/upload/v1789731602/meta-nft/xkgssoeumw5fr5ar764d.jpg	240	2.2	active	2026-09-16 08:15:01.021911
34	Honey BEE	listed on binance	https://res.cloudinary.com/wxcmwjru/image/upload/v1789731604/meta-nft/nl3v2eqsfg9xnc3o245k.jpg	230	2.2	active	2026-09-16 08:14:18.743885
33	Choco Cat	listed on open sae	https://res.cloudinary.com/wxcmwjru/image/upload/v1789731608/meta-nft/nw80ow7dvagljxvwdxir.jpg	220	2.2	active	2026-09-16 08:13:42.378999
31	Pinkey Boo	listed on okx	https://res.cloudinary.com/wxcmwjru/image/upload/v1789731620/meta-nft/sdphjdayb0kqqd6tmic4.jpg	200	2.1	active	2026-09-16 08:11:56.421658
30	Lovey Dove	listed on okx	https://res.cloudinary.com/wxcmwjru/image/upload/v1789731623/meta-nft/ful4ds2mxrlkbigf4ovz.jpg	190	2.1	active	2026-09-16 08:11:03.389184
28	Cutie pie	listed on binance	https://res.cloudinary.com/wxcmwjru/image/upload/v1789731631/meta-nft/hxbrtixgiay9qxjnw45e.jpg	180	2.1	active	2026-09-16 08:09:53.507965
27	Cherry baby	listed on okx	https://res.cloudinary.com/wxcmwjru/image/upload/v1789731643/meta-nft/tpoumjgktplhseqfjbea.jpg	170	2.1	active	2026-09-16 08:08:38.847946
25	cutie Galaxy	listed on open sea	https://res.cloudinary.com/wxcmwjru/image/upload/v1789731649/meta-nft/iusjuuzp5tidbzlentr9.jpg	150	2.1	active	2026-09-16 08:07:05.50661
24	Luv monster	listed on open sea	https://res.cloudinary.com/wxcmwjru/image/upload/v1789731654/meta-nft/d0aubnzh56rmvbubai3s.jpg	140	2.1	active	2026-09-16 08:06:10.656654
22	Coazy Coala		https://res.cloudinary.com/wxcmwjru/image/upload/v1789731667/meta-nft/afbip10htfvdwxmcifp5.jpg	120	2.1	active	2026-09-16 08:04:27.98808
21	Tiny Teddy	live	https://res.cloudinary.com/wxcmwjru/image/upload/v1789731671/meta-nft/k3etlfsjfpvodqmalven.jpg	110	2.1	active	2026-09-16 08:04:00.982558
18	Fairy fluff		https://res.cloudinary.com/wxcmwjru/image/upload/v1789731686/meta-nft/gqtsdusn4he6j9hbahli.jpg	82	2.1	active	2026-09-16 07:42:34.197957
17	Mystic meow		https://res.cloudinary.com/wxcmwjru/image/upload/v1789731693/meta-nft/qv9q5mdsxktqvzlutmag.jpg	80	2.1	active	2026-09-16 07:42:03.349157
16	Golden Glow	lised on Binance	https://res.cloudinary.com/wxcmwjru/image/upload/v1789731696/meta-nft/oct8ut4awyv66onpdrnt.jpg	78	2.1	active	2026-09-16 07:41:33.748033
14	starry eyes	listed on okx marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789731706/meta-nft/tblx4ajcckxjfchfkj3m.jpg	72	2.1	active	2026-09-16 07:39:45.976863
13	Dreamy Doll	listed on open sea marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789731710/meta-nft/udnomhcps008atbft0lb.jpg	72	2.1	active	2026-09-16 07:39:12.489225
11	Honey Heart		https://res.cloudinary.com/wxcmwjru/image/upload/v1789731727/meta-nft/pq425fekkya4on9fn8lf.jpg	70	2.1	active	2026-09-16 07:37:46.603095
10	candy cloud		https://res.cloudinary.com/wxcmwjru/image/upload/v1789731729/meta-nft/rkeehbb8f19lkgufjm6b.jpg	57	2.1	active	2026-09-16 07:37:20.876141
8	Lovely LUNA		https://res.cloudinary.com/wxcmwjru/image/upload/v1789731737/meta-nft/ebffup02vuajwrrure1x.jpg	36	1.9	active	2026-09-16 07:36:10.131535
7	blushy bear nft		https://res.cloudinary.com/wxcmwjru/image/upload/v1789731747/meta-nft/mjm8khtujmicp9vyib1d.jpg	51	2.1	active	2026-09-16 07:35:33.653396
5	riggle NFT	live marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789731769/meta-nft/s8lzzqqdcppoajmctbxu.jpg	50	2.1	active	2026-09-16 07:32:06.888803
4	puple nft	nft listed on open sae	https://res.cloudinary.com/wxcmwjru/image/upload/v1789731778/meta-nft/rpcl6cmbrtz4apcs1bc3.webp	47	2	active	2026-09-16 07:30:49.244242
2	silver nft	nft live marketplace on binance	https://res.cloudinary.com/wxcmwjru/image/upload/v1789731808/meta-nft/nuefmmxsocqwefnizytr.jpg	35	1.9	active	2026-09-16 07:29:31.512028
95	New Nft		https://res.cloudinary.com/wxcmwjru/image/upload/v1789649422/meta-nft/ktwt01vfamvizxz4htvx.webp	1400	2.3	active	2026-09-16 18:41:59.331293
20	chubby pengion	live market place	https://res.cloudinary.com/wxcmwjru/image/upload/v1789714325/meta-nft/u4lhgku4ycoynyetsrwz.png	100	2.1	active	2026-09-16 08:03:24.766099
94	Rocky Don		https://res.cloudinary.com/wxcmwjru/image/upload/v1789726750/meta-nft/fxypqwbe33k5xdlhlxkl.jpg	1500	2.3	active	2026-09-16 09:33:36.806822
93	velvet vibes 3454	listed on bitget	https://res.cloudinary.com/wxcmwjru/image/upload/v1789726755/meta-nft/kbhrbssmj1h4mcca9lwk.jpg	1450	2.3	active	2026-09-16 09:33:17.347984
92	Monzy Doll	listed on Binance	https://res.cloudinary.com/wxcmwjru/image/upload/v1789726762/meta-nft/wdwdcevgxfjro2eze6cn.webp	1400	2.3	active	2026-09-16 09:32:50.321499
91	Manager com	listed on okx	https://res.cloudinary.com/wxcmwjru/image/upload/v1789726773/meta-nft/uou5ezcaevw3xs9asmnf.png	1350	2.3	active	2026-09-16 09:32:12.169953
90	Admin Rock	listed on okx	https://res.cloudinary.com/wxcmwjru/image/upload/v1789726778/meta-nft/odokp4tasp0isuo6yjyc.png	1300	2.3	active	2026-09-16 09:31:33.729243
89	Platinium Nft	listed on open sea	https://res.cloudinary.com/wxcmwjru/image/upload/v1789726784/meta-nft/dloz7vir3vd2lhcs7a3a.png	1250	2.3	active	2026-09-16 09:30:59.234307
88	Rocky Bull	listed on okx	https://res.cloudinary.com/wxcmwjru/image/upload/v1789726788/meta-nft/imxmifnxmnbup8aoivd1.png	1200	2.3	active	2026-09-16 09:30:25.90586
87	Tony King	listed on okx	https://res.cloudinary.com/wxcmwjru/image/upload/v1789726799/meta-nft/keezpg4znjqlqr48uokk.png	1150	2.2	active	2026-09-16 09:29:57.546551
86	Mr.Bush	listed on open sea	https://res.cloudinary.com/wxcmwjru/image/upload/v1789726802/meta-nft/mokjxfwfrir2g0g6xzt9.png	1100	2.2	active	2026-09-16 09:29:10.301992
85	Sky Angel	listed on local marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789726806/meta-nft/isopz37td2lfnrilxvsl.png	1050	2.2	active	2026-09-16 09:28:30.377663
84	Jerry King	listed on okx	https://res.cloudinary.com/wxcmwjru/image/upload/v1789726814/meta-nft/i3d7akc4zkjtsy5xoljj.png	1000	2.2	active	2026-09-16 09:27:41.879766
83	Rocky Don	listed on open sea	https://res.cloudinary.com/wxcmwjru/image/upload/v1789727240/meta-nft/pjzze2ypdumi2xag8je6.png	980	2.2	active	2026-09-16 09:27:07.888244
82	Moneky Don	listed on open sea	https://res.cloudinary.com/wxcmwjru/image/upload/v1789727245/meta-nft/eu8p2rttbnpvdphlqrio.jpg	960	2.2	active	2026-09-16 09:26:43.859594
81	Moneky Race	listed on okx	https://res.cloudinary.com/wxcmwjru/image/upload/v1789727249/meta-nft/f1sbfi1c7rhpiliwsohy.jpg	940	2.2	active	2026-09-16 09:26:11.037104
80	Cute Young	listed on binance marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789727253/meta-nft/cujp0xnjpeiuxbqxiurb.jpg	920	2.2	active	2026-09-16 09:25:48.047657
79	Ponzy Skill	listed on open sea marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789727261/meta-nft/b8hdnlqkzbds71iqxaam.jpg	900	2.2	active	2026-09-16 09:25:00.091941
78	Lazy Girl 3579	listed on okx	https://res.cloudinary.com/wxcmwjru/image/upload/v1789727265/meta-nft/u1amyo9anhcaxi59rznl.jpg	880	2.2	active	2026-09-16 09:24:08.051926
77	Red Zone 4432	listed on open sea	https://res.cloudinary.com/wxcmwjru/image/upload/v1789727271/meta-nft/xouurcngyhwnpiewowcq.jpg	860	2.2	active	2026-09-16 09:23:36.868437
76	Black girl	listed on okx	https://res.cloudinary.com/wxcmwjru/image/upload/v1789727275/meta-nft/mrh7fwot1uppgxi3b1mz.jpg	840	2.2	active	2026-09-16 09:22:06.232114
75	NFT 3242	listed on okx	https://res.cloudinary.com/wxcmwjru/image/upload/v1789727291/meta-nft/ebmopkwu5fnqdmc1uty9.jpg	820	2.2	active	2026-09-16 09:21:36.884038
74	Rigger DON		https://res.cloudinary.com/wxcmwjru/image/upload/v1789727296/meta-nft/k8dab80ovavyja6lvbkg.jpg	800	2.2	active	2026-09-16 09:21:10.977871
73	Crazy Boy		https://res.cloudinary.com/wxcmwjru/image/upload/v1789727301/meta-nft/nn6tn5y5gilvqmiwu05r.jpg	780	2.2	active	2026-09-16 09:20:50.252054
67	silver nft 2		https://res.cloudinary.com/wxcmwjru/image/upload/v1789727354/meta-nft/tuy6goqvukdavwmhtgnx.jpg	660	2.2	active	2026-09-16 09:17:55.127444
72	Meta Doll		https://res.cloudinary.com/wxcmwjru/image/upload/v1789727314/meta-nft/reid1qs8uy5rwe9kqf7k.jpg	760	2.2	active	2026-09-16 09:20:30.202731
71	MY NFT 3	listed on open sea	https://res.cloudinary.com/wxcmwjru/image/upload/v1789727334/meta-nft/wvdqt97ehlgwyg2jsjj9.jpg	740	2.2	active	2026-09-16 09:20:08.205826
70	Crazy Doll		https://res.cloudinary.com/wxcmwjru/image/upload/v1789727337/meta-nft/rzpsjjenvysfxpy2qvx7.jpg	720	2.2	active	2026-09-16 09:19:08.270497
69	Brown Nft		https://res.cloudinary.com/wxcmwjru/image/upload/v1789727344/meta-nft/wzmyzdu1j2x2w3lcs2vk.jpg	700	2.2	active	2026-09-16 09:18:47.852083
68	Puppy Doll		https://res.cloudinary.com/wxcmwjru/image/upload/v1789727348/meta-nft/u8cu1hguobw5dzmfhbcg.jpg	680	2.2	active	2026-09-16 09:18:17.552633
66	Lucky Nft 2		https://res.cloudinary.com/wxcmwjru/image/upload/v1789727360/meta-nft/qbctalvuvlleog47b8mc.jpg	640	2.2	active	2026-09-16 09:17:31.005407
65	Golden nft		https://res.cloudinary.com/wxcmwjru/image/upload/v1789727363/meta-nft/nbq4l36ahv2lwpgk5o7q.jpg	620	2.2	active	2026-09-16 09:17:09.478485
64	Lazy pretty	listed on bnance	https://res.cloudinary.com/wxcmwjru/image/upload/v1789727367/meta-nft/ryxeed9nxmpzkron0xvq.jpg	600	2.2	active	2026-09-16 09:16:46.905937
63	Silver Boss	listed on bitget	https://res.cloudinary.com/wxcmwjru/image/upload/v1789727377/meta-nft/axb4jpynybleywkgxamt.jpg	580	2.2	active	2026-09-16 09:16:16.989436
60	RED zone	listed on okx	https://res.cloudinary.com/wxcmwjru/image/upload/v1789727387/meta-nft/kuk3jxyvzzi4jbpk592v.jpg	520	2.2	active	2026-09-16 09:14:46.302541
57	Baby Queen	listed on open sea	https://res.cloudinary.com/wxcmwjru/image/upload/v1789727409/meta-nft/tc0xysavgk7yvlmxxwyx.jpg	480	2.2	active	2026-09-16 08:43:34.487855
54	Star pop	listed on okx	https://res.cloudinary.com/wxcmwjru/image/upload/v1789727435/meta-nft/tvljjprfi6cqivxg2sex.png	440	2.2	active	2026-09-16 08:41:24.401306
51	Rubby Snow	listed on okx	https://res.cloudinary.com/wxcmwjru/image/upload/v1789731488/meta-nft/wqngjokgqn9ajzhqen4x.jpg	400	2.2	active	2026-09-16 08:27:22.279853
48	Lubby Don	listed on okx	https://res.cloudinary.com/wxcmwjru/image/upload/v1789731500/meta-nft/k7sawlkxnesyulwtwkhj.jpg	370	2.2	active	2026-09-16 08:25:35.484669
45	puppy	listed on okx	https://res.cloudinary.com/wxcmwjru/image/upload/v1789731551/meta-nft/oxettiiqvmdpcyeerj4q.webp	340	2.2	active	2026-09-16 08:22:05.193546
42	Sugar Pop	listed on open sea	https://res.cloudinary.com/wxcmwjru/image/upload/v1789731567/meta-nft/fbjzaxcz0shvoiiydrsk.jpg	310	2.2	active	2026-09-16 08:19:15.903833
39	Sun Shine	listed on nft marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789731584/meta-nft/awjctis9ota0y5eo6sn0.jpg	280	2.2	active	2026-09-16 08:17:20.156148
36	Star Girl	listed on open sea marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789731594/meta-nft/qowq2vzgss5noaeqadpx.jpg	250	2.2	active	2026-09-16 08:15:48.220019
32	Tiny Star	listed on binance	https://res.cloudinary.com/wxcmwjru/image/upload/v1789731611/meta-nft/qyn32zqbdpe840qpwbqd.jpg	210	2.2	active	2026-09-16 08:13:06.015312
29	Mini Moon	listed on open sea	https://res.cloudinary.com/wxcmwjru/image/upload/v1789731627/meta-nft/cal3ubie3znjyo79daez.jpg	180	2.1	active	2026-09-16 08:10:20.651986
26	Baby Unicorn	listed on okx marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789731646/meta-nft/v6qnzwtv50f29uuj7ny0.jpg	160	2.1	active	2026-09-16 08:08:00.451404
23	Pinkey paws	Listed on BINANCE	https://res.cloudinary.com/wxcmwjru/image/upload/v1789731663/meta-nft/vk4j88s9q9xpp5lrrorm.jpg	130	2.1	active	2026-09-16 08:05:02.623056
19	velvet vibes	NFT listed on binance exchange marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789731683/meta-nft/lhyfkxzaeugw6tolsbvl.jpg	90	2.1	active	2026-09-16 08:01:27.639875
15	Crystal Cutie	listed on binance	https://res.cloudinary.com/wxcmwjru/image/upload/v1789731703/meta-nft/urovqjmrgickmryybfq7.jpg	75	2.1	active	2026-09-16 07:40:50.796701
12	Rosy Kitty NFT		https://res.cloudinary.com/wxcmwjru/image/upload/v1789731713/meta-nft/alglz9fxdlug700b2jz7.jpg	67	2.1	active	2026-09-16 07:38:28.843155
9	sweetie pop		https://res.cloudinary.com/wxcmwjru/image/upload/v1789731733/meta-nft/zb7zf9zgdqpfvbenejor.jpg	35	1.9	active	2026-09-16 07:36:56.568001
6	new NFT	live marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789731751/meta-nft/u9e0psrzcpj4xnmavoj7.jpg	50	2.1	active	2026-09-16 07:32:34.864848
3	crazy	nft listed on okx	https://res.cloudinary.com/wxcmwjru/image/upload/v1789731803/meta-nft/eoskb87k1bpslhf4bmno.webp	43	1.9	active	2026-09-16 07:30:07.843227
1	Golden nft	nft live marketplace listed	https://res.cloudinary.com/wxcmwjru/image/upload/v1789731813/meta-nft/fmz848lomen7zuu5ltkk.webp	30	1.9	active	2026-09-16 07:28:56.510385
96	Alex NFT	listed on open sea marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789731897/meta-nft/nlm7qyj4ibwxsg91hgcd.jpg	103	1.9	active	2026-09-18 11:44:57.79788
97	Commando NFT	listed on okx	https://res.cloudinary.com/wxcmwjru/image/upload/v1789731941/meta-nft/b7rnrbfnacmccdeuhr5f.webp	104	2.1	active	2026-09-18 11:45:41.945124
98	Arrow Mercury	listed on open sea marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789731986/meta-nft/hzhzyknhmi6dyidksqov.jpg	105	2.1	active	2026-09-18 11:46:26.740982
99	Rainbox NFT		https://res.cloudinary.com/wxcmwjru/image/upload/v1789732019/meta-nft/vazhhlyosj0zxzp9trhv.jpg	108	2.1	active	2026-09-18 11:47:00.227886
100	SUN Light	listed on okx marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789732076/meta-nft/nybrqjmp0quxjvcned4j.jpg	112	2.1	active	2026-09-18 11:47:56.48997
101	Moon Light	listed on Binance marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789732124/meta-nft/yiudfarqqg83bi3uptht.jpg	102	2.1	active	2026-09-18 11:48:45.278339
102	Day Night NFT	listed on okx	https://res.cloudinary.com/wxcmwjru/image/upload/v1789732163/meta-nft/mntszk4aaeqjtp7s6228.jpg	1450	2.4	active	2026-09-18 11:49:23.724744
103	Night Light	listed on binance marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789732212/meta-nft/ai9w1epiyyjgf45fbtha.jpg	1550	2.4	active	2026-09-18 11:50:13.220797
104	Jerry Nft	listed on google	https://res.cloudinary.com/wxcmwjru/image/upload/v1789732251/meta-nft/i7m9bor7gxpwre7ujsw2.jpg	1650	2.4	active	2026-09-18 11:50:51.967524
105	Robby NFT	listed on binance nft marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789732290/meta-nft/xamqffelefxhrg5l12ty.jpg	1700	2.4	active	2026-09-18 11:51:30.872402
106	Jerry Tom	listed on okx	https://res.cloudinary.com/wxcmwjru/image/upload/v1789732325/meta-nft/rtxtpyzwqitfpwbjz5ve.jpg	1800	2.4	active	2026-09-18 11:52:05.70836
107	Jelious NFT	listed on bitget nft marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789732359/meta-nft/nwrqoltmrgehemz3pbey.jpg	1900	2.4	active	2026-09-18 11:52:41.115062
108	Alex NFT 2	listed on okx	https://res.cloudinary.com/wxcmwjru/image/upload/v1789732389/meta-nft/yetqnamyellmtirzk5iq.jpg	2000	2.5	active	2026-09-18 11:53:10.299765
109	Lucky Nft 2	listed on binance	https://res.cloudinary.com/wxcmwjru/image/upload/v1789732423/meta-nft/p3dmomyzod8bwjhgqxio.jpg	2100	2.5	active	2026-09-18 11:53:44.436005
110	Golden puppy 2	listed on binance	https://res.cloudinary.com/wxcmwjru/image/upload/v1789732453/meta-nft/p19zdblcqhmiop23jdwd.jpg	2200	2.5	active	2026-09-18 11:54:13.982391
111	Golden puppy 2	listed on binance	https://res.cloudinary.com/wxcmwjru/image/upload/v1789732456/meta-nft/njlbkyifye0m9rqrnk5m.jpg	2200	2.5	active	2026-09-18 11:54:16.963318
112	Golden puppy 2	listed on binance	https://res.cloudinary.com/wxcmwjru/image/upload/v1789732457/meta-nft/kbkl52d6bg4zaqwgrlhg.jpg	2200	2.5	active	2026-09-18 11:54:17.743897
113	Golden puppy 3	listed on okx	https://res.cloudinary.com/wxcmwjru/image/upload/v1789732506/meta-nft/xoczve41iyfpo5zxkhgs.jpg	2300	2.5	active	2026-09-18 11:55:07.422728
114	Alex NFT 3	listed on opensea	https://res.cloudinary.com/wxcmwjru/image/upload/v1789732538/meta-nft/kluxhdplan7ltrr9hbih.jpg	2400	2.5	active	2026-09-18 11:55:39.601573
115	Golden puppy4	listed on binance	https://res.cloudinary.com/wxcmwjru/image/upload/v1789732574/meta-nft/jtkblseymu6qnhalacvi.jpg	33	1.9	active	2026-09-18 11:56:15.14042
116	Golden puppy	listed on okx	https://res.cloudinary.com/wxcmwjru/image/upload/v1789732605/meta-nft/vzvspq3ileymn7dpyln0.jpg	3000	2.5	active	2026-09-18 11:56:46.480587
117	Alex NFT	listed on okx	https://res.cloudinary.com/wxcmwjru/image/upload/v1789732645/meta-nft/apvx7gv6mpllbhictufd.jpg	3500	2.7	active	2026-09-18 11:57:25.494987
118	Lucky Nft	listed on okx	https://res.cloudinary.com/wxcmwjru/image/upload/v1789732679/meta-nft/bamcfz2lfvriwaqkhpev.jpg	4000	2.7	active	2026-09-18 11:57:59.756019
119	Lucky Nft	listed on okx	https://res.cloudinary.com/wxcmwjru/image/upload/v1789732711/meta-nft/fgjultlfnlhuu6oepujy.jpg	50	2.1	active	2026-09-18 11:58:32.29905
120	golden nnn	listed on okx	https://res.cloudinary.com/wxcmwjru/image/upload/v1789732761/meta-nft/usmgelvwwj8z7tbton4u.jpg	102	2.1	active	2026-09-18 11:59:22.201527
121	velvet vibes	listed on okx	https://res.cloudinary.com/wxcmwjru/image/upload/v1789732787/meta-nft/rzlxwgdzgwaloe7yeeep.jpg	108	2.1	active	2026-09-18 11:59:47.56153
122	golden nnn09	listed on binance	https://res.cloudinary.com/wxcmwjru/image/upload/v1789732821/meta-nft/ouslwx7qu5evzfiwoxts.jpg	112	2.1	active	2026-09-18 12:00:21.915575
123	Robby DON	listed on okx	https://res.cloudinary.com/wxcmwjru/image/upload/v1789732897/meta-nft/tk1w7hfxzffq9n8qizaa.jpg	120	2.1	active	2026-09-18 12:01:37.93374
124	NEW NFT	listed on ojx	https://res.cloudinary.com/wxcmwjru/image/upload/v1789732941/meta-nft/fastejnawcdyb8ydbone.jpg	125	2.1	active	2026-09-18 12:02:22.572991
125	golden nnn	listed on opensea	https://res.cloudinary.com/wxcmwjru/image/upload/v1789732967/meta-nft/agv1qaqpaod3gctztp2d.jpg	75	2.1	active	2026-09-18 12:02:48.375687
126	Black Rock	listed on okx	https://res.cloudinary.com/wxcmwjru/image/upload/v1789732996/meta-nft/gxyjc5kndnwsk807gr7j.jpg	55	2.1	active	2026-09-18 12:03:17.047655
127	Lucky Nft	listed on okx	https://res.cloudinary.com/wxcmwjru/image/upload/v1789733022/meta-nft/bh8q7aex3muipjwlnrbz.jpg	65	2.1	active	2026-09-18 12:03:42.725883
128	Golden puppy	listed on okx	https://res.cloudinary.com/wxcmwjru/image/upload/v1789733051/meta-nft/qiwtopbdubnqtzwxtiej.jpg	100	2.1	active	2026-09-18 12:04:11.9244
129	Golden puppy god	listed on open sea marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789733100/meta-nft/ja9c9pljnjujvcvronum.jpg	30	2.1	active	2026-09-18 12:05:00.970067
130	Golden nft 2	listed on open sea marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789733142/meta-nft/ljiw3p88y9mcfnwjsyb3.jpg	70	2.1	active	2026-09-18 12:05:42.872197
131	Golden nft 5	listed on open sea marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789733173/meta-nft/kmmufdgbodywv9jdp7qd.jpg	108	2.1	active	2026-09-18 12:06:14.156984
132	Lucky Nft34343	listed on open sea marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789733196/meta-nft/qbozsodcseol7zq3sz8g.jpg	112	2.1	active	2026-09-18 12:06:37.543894
134	Golden nft	listed on open sea marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789733249/meta-nft/zgikkyd0jt223tocm3ht.jpg	115	2.1	active	2026-09-18 12:07:29.818753
135	Golden nft4547	listed on open sea marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789733280/meta-nft/dngrdhptu5siwhzd6uad.jpg	125	2.1	active	2026-09-18 12:08:00.805092
136	Carrot Nft	listed on open sea marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789733325/meta-nft/bmjtujdw5wlasolfu0ax.jpg	127	2.1	active	2026-09-18 12:08:46.32092
137	DON NFT	listed on open sea marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789733355/meta-nft/bh2pbregyqjqnjjcecrh.jpg	129	2.1	active	2026-09-18 12:09:15.898869
139	Golden puppy 6745	listed on open sea marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789733384/meta-nft/yxezq4uw1miiktl51bg3.jpg	131	2.1	active	2026-09-18 12:09:45.360883
140	Lovely Lady	listed on open sea marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789733423/meta-nft/cunwesy0curv51d14x10.jpg	133	2.1	active	2026-09-18 12:10:24.437681
143	Glaxy NFT	listed on open sea marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789733513/meta-nft/pfwzh16s92svgqcpzwyn.jpg	139	2.1	active	2026-09-18 12:11:54.699341
144	Sun Roof	listed on open sea marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789733545/meta-nft/eragnv1bt34nneipzvej.jpg	141	2.1	active	2026-09-18 12:12:25.899421
145	Alex NFT	listed on open sea marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789733580/meta-nft/ajygq9hhliioeownqtvn.jpg	143	2.1	active	2026-09-18 12:13:01.365537
146	Golden puppy	listed on open sea marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789733605/meta-nft/hisjn0przjo0pmcwn2kx.jpg	144	2.1	active	2026-09-18 12:13:26.257932
147	Sun Light 3421	listed on open sea marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789733664/meta-nft/ywxzgoxtyvussmcuj83a.jpg	146	2.1	active	2026-09-18 12:14:24.87006
148	Dove Light	listed on open sea marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789733702/meta-nft/rxffmzz23zyvbjunvzxc.jpg	148	2.1	active	2026-09-18 12:15:02.689514
149	Sun Rise	listed on open sea marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789733739/meta-nft/mv2wcm0vrdqrxo90nwbv.jpg	151	2.1	active	2026-09-18 12:15:40.392556
150	Lucky Nft	listed on open sea marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789733787/meta-nft/qdkytkcgseied9psfz0l.jpg	152	2.1	active	2026-09-18 12:16:28.44417
151	Summer Vain	listed on open sea marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789733833/meta-nft/btixtervpmkldmu8r6xs.jpg	154	2.1	active	2026-09-18 12:17:13.809668
152	Dove Grey	listed on open sea marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789733867/meta-nft/zloe9f55zo2935peaebz.jpg	156	2.1	active	2026-09-18 12:17:48.226589
153	SUN Light	listed on open sea marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789733923/meta-nft/fp1qpcjsv4vx6ujkyfwn.jpg	158	2.1	active	2026-09-18 12:18:44.658694
154	Golden puppy	listed on open sea marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789733967/meta-nft/httor5nasz2ivmdg1n3p.jpg	161	2.1	active	2026-09-18 12:19:28.127415
155	Root Queeue	listed on open sea marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789734020/meta-nft/voliqunlxjyzdrip4cfa.jpg	102	2.1	active	2026-09-18 12:20:21.104152
156	Alex NFT	listed on open sea marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789734100/meta-nft/b4nx6f8kqqhigmvm9g7z.jpg	109	2.1	active	2026-09-18 12:21:41.894852
157	velvet vibes	listed on open sea marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789734125/meta-nft/evbikt73l88eoaythauk.jpg	117	2.1	active	2026-09-18 12:22:05.824101
159	Golden puppy0984	listed on open sea marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789734176/meta-nft/pqvtfdnmtx5layf040i3.jpg	123	2.1	active	2026-09-18 12:22:56.653622
160	Jeniune Night NFT	listed on open sea marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789734212/meta-nft/nnarqjozokqmekim3u87.jpg	81	2.1	active	2026-09-18 12:23:32.618795
161	Rock Style	listed on open sea marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789734250/meta-nft/luvjigdu5nzhbqizoryl.jpg	83	2.1	active	2026-09-18 12:24:11.283916
162	Valvet NFT	listed on open sea marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789734329/meta-nft/dml52ttx4qhjklvxj12i.jpg	84	2.1	active	2026-09-18 12:25:30.275925
163	golden nnn	listed on open sea marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789734376/meta-nft/qpzj6engiyil39msb4og.jpg	87	2.1	active	2026-09-18 12:26:16.634552
164	Golden nft	listed on open sea marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789734414/meta-nft/kyyxytxeumwzsv8e4gln.jpg	103	2.1	active	2026-09-18 12:26:55.667118
165	Alex NFT4532	listed on open sea marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789734475/meta-nft/vp8n7mq2xplho6oqdvdi.jpg	107	2.1	active	2026-09-18 12:27:55.681283
166	Silver NFT	listed on open sea marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789734608/meta-nft/nvxpcviytpcufqgpoyn5.jpg	112	2.1	active	2026-09-18 12:30:09.374765
158	Alex NFT3233	listed on open sea marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789734693/meta-nft/pnrbxkjk9e5aix5nygpd.jpg	121	2.1	active	2026-09-18 12:22:34.01249
138	DON NFT	listed on open sea marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789734756/meta-nft/eegcnflxv2gauae2lv2v.jpg	129	2.1	active	2026-09-18 12:09:22.745966
142	Lucky Nft	listed on open sea marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789734727/meta-nft/p4ktmpqw3bdq8ln3ltdh.jpg	137	2.1	active	2026-09-18 12:11:21.432628
141	golden NFT	listed on open sea marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789734741/meta-nft/jyk0v3fq4qts2ozyzqwz.jpg	135	2.1	active	2026-09-18 12:10:55.330017
133	Alex NFT	listed on open sea marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789734770/meta-nft/xhytfd9ru1g99lkxuvlc.jpg	114	2.1	active	2026-09-18 12:07:02.590105
167	golden nnn	listed on open sea marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789734672/meta-nft/yzaqp8dgewwaccfb5t6s.jpg	114	2.1	active	2026-09-18 12:30:34.863003
168	rocky nft6586	listed on open sea marketplace	https://res.cloudinary.com/wxcmwjru/image/upload/v1789734809/meta-nft/rp94axhprn0ylznfu4ug.jpg	122	2.1	active	2026-09-18 12:33:30.427615
\.


--
-- Data for Name: referral_bonuses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.referral_bonuses (id, referrer_id, referred_user_id, deposit_id, deposit_amount, bonus_percent, bonus_amount, created_at) FROM stdin;
1	1	2	3	1000	10	100	2026-08-30 15:54:45.938867
2	2	4	4	100	10	10	2026-09-08 19:23:22.699249
3	2	5	5	100	10	10	2026-09-12 05:11:30.954143
4	2	7	6	100	10	10	2026-09-18 06:53:13.131325
5	4	8	7	200	10	20	2026-09-18 14:32:43.689989
6	2	14	8	30	10	3	2026-09-22 07:43:21.477057
\.


--
-- Data for Name: reservations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reservations (id, user_id, balance_before, profit_percent, profit_amount, balance_after, status, created_at) FROM stdin;
1	1	0	1.4	0	0	completed	2026-08-30 09:12:49.411786
2	2	1000	1.2	12	1012	completed	2026-08-30 15:55:18.883993
3	2	1012	1.4	14.168	1026.168	completed	2026-08-31 17:37:33.915703
4	2	1026.168	1.2	12.314016	1038.482016	completed	2026-09-01 18:46:47.418349
5	2	1038.482016	1.3	13.500266	1051.982282	completed	2026-09-03 04:46:14.204147
6	2	1051.982282	1.3	13.67577	1065.658052	completed	2026-09-04 18:42:28.13466
7	2	1065.658052	1.2	12.787897	1078.445949	completed	2026-09-06 04:42:50.885195
8	2	1078.445949	1.4	15.098243	1093.544192	completed	2026-09-07 08:36:31.317094
9	4	0	1.4	0	0	completed	2026-09-07 19:36:49.337937
10	2	1023.544192	1.5	15.353163	1038.897355	completed	2026-09-08 16:45:58.997536
11	4	100	1.2	1.2	101.2	completed	2026-09-08 19:52:02.678582
12	2	1048.897355	1.5	15.73346	1064.630815	completed	2026-09-09 17:45:02.790126
13	4	101.2	1.5	1.518	102.718	completed	2026-09-09 19:52:41.937125
14	4	102.718	1.2	1.232616	103.950616	completed	2026-09-10 20:00:17.210514
15	2	1064.630815	1.2	12.77557	1077.406385	completed	2026-09-11 06:37:10.874038
16	4	103.950616	1.5	1.559259	105.509875	completed	2026-09-11 20:00:36.285692
17	2	1087.406385	1.5	16.311096	1103.717481	completed	2026-09-12 08:36:05.186367
18	4	105.509875	1.4	1.477138	106.987013	completed	2026-09-12 20:00:51.758971
19	5	100	1.2	1.2	101.2	completed	2026-09-13 02:26:26.569818
20	3	0	1.4	0	0	completed	2026-09-13 09:04:47.91127
21	4	106.987013	1.2	1.283844	108.270857	completed	2026-09-13 22:39:49.95016
22	5	101.2	1.4	1.4168	102.6168	completed	2026-09-14 07:12:52.747329
23	6	0	1.4	0	0	completed	2026-09-14 18:13:23.626862
24	4	108.270857	1.4	1.515792	109.786649	completed	2026-09-14 22:49:57.285383
25	2	1103.717481	1.3	14.348327	1118.065808	completed	2026-09-15 11:28:20.538303
26	5	102.6168	1.3	1.334018	103.950818	completed	2026-09-15 18:09:46.479133
27	4	109.786649	1.4	1.537013	111.323662	completed	2026-09-16 03:04:06.880903
28	2	1118.065808	0	0	18.065808	completed	2026-09-16 18:39:05.593744
29	4	111.323662	0	0	54.323662	completed	2026-09-17 04:51:35.057392
30	4	112.520662	0	0	2.520662	completed	2026-09-18 02:41:57.246551
31	7	100	0	0	0	completed	2026-09-18 06:56:44.721539
32	2	1152.265808	0	0	2.265808	completed	2026-09-18 14:35:00.5928
33	8	200	0	0	0	completed	2026-09-18 14:36:39.868736
34	4	100.830662	0	0	0.830662	completed	2026-09-19 01:52:40.325945
35	8	204.2	0	0	4.2	completed	2026-09-19 01:53:30.099539
36	2	1177.565808	0	0	27.565808	completed	2026-09-19 06:28:01.669177
37	5	103.950818	0	0	3.950818	completed	2026-09-19 06:42:09.512998
38	7	102.1	0	0	0.1	completed	2026-09-19 07:10:14.464451
39	4	100.000662	0	0	0.000662	completed	2026-09-20 01:48:49.815913
40	8	200.4	0	0	0.4	completed	2026-09-20 01:49:40.458445
41	7	104.242	0	0	0.242	completed	2026-09-20 07:35:25.865906
42	2	1162.865808	0	0	12.865808	completed	2026-09-20 16:20:14.078261
43	4	139.030662	0	0	0.030662	completed	2026-09-21 01:54:31.222158
44	8	204.6	0	0	4.6	completed	2026-09-21 01:55:30.566539
45	5	106.050818	0	0	3.050818	completed	2026-09-21 02:21:27.930099
46	2	1188.165808	0	0	38.165808	completed	2026-09-21 06:45:27.791779
47	7	106.426	0	0	1.426	completed	2026-09-21 07:38:04.004321
48	5	108.213818	0	0	0.213818	completed	2026-09-22 04:19:27.777319
49	8	208.8	0	0	8.8	completed	2026-09-22 05:01:14.97724
50	4	141.949662	0	0	0.949662	completed	2026-09-22 05:01:49.563564
51	2	1213.465808	0	0	13.465808	completed	2026-09-22 05:33:06.545502
52	7	108.631	0	0	0.631	completed	2026-09-22 07:41:03.399934
53	14	30	0	0	0	completed	2026-09-22 07:47:26.523312
54	14	30.63	0	0	0.63	completed	2026-09-23 02:55:00.084364
55	8	213	0	0	3	completed	2026-09-23 05:03:40.963222
56	4	144.910662	0	0	0.910662	completed	2026-09-23 05:04:25.187485
57	7	110.899	0	0	0.899	completed	2026-09-23 07:44:54.747068
58	2	1244.065808	0	0	44.065808	completed	2026-09-23 10:21:06.928548
59	8	217.62	0	0	7.62	completed	2026-09-24 04:26:20.385716
60	4	147.934662	0	0	1.934662	completed	2026-09-24 04:26:52.521175
61	7	113.209	0	0	1.209	completed	2026-09-24 07:47:18.55058
62	14	31.2	0	0	1.2	completed	2026-09-24 08:19:05.91443
63	2	1271.665808	0	0	21.665808	completed	2026-09-24 08:30:01.731328
\.


--
-- Data for Name: site_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.site_settings (id, setting_key, setting_value, updated_at) FROM stdin;
1	bep20_usdt_address	0xa1d82829F53050D25CeD9CFA73350c40b103e1f1	2026-09-16 09:34:18.028681
2	trc20_usdt_address	TM9Lwe4DFEfEnVERutnUotMtPt1sTyBL9g	2026-09-16 09:34:18.030777
\.


--
-- Data for Name: user_nfts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_nfts (id, user_id, nft_id, purchase_price, expected_profit_percent, expected_profit_amount, purchase_date, sold_at, sale_price, profit_amount, status) FROM stdin;
1	2	86	1100	2.2	0	2026-09-16 18:39:05.593744	2026-09-16 18:39:18.111357	1124.2	24.2	sold
2	4	10	57	2.1	0	2026-09-17 04:51:35.057392	2026-09-17 04:51:45.106922	58.197	1.197	sold
3	4	21	110	2.1	0	2026-09-18 02:41:57.246551	2026-09-18 02:42:07.832705	112.31	2.31	sold
4	7	20	100	2.1	0	2026-09-18 06:56:44.721539	2026-09-18 06:57:53.034609	102.1	2.1	sold
5	2	87	1150	2.2	0	2026-09-18 14:35:00.5928	2026-09-18 14:35:09.838674	1175.3	25.3	sold
6	8	31	200	2.1	0	2026-09-18 14:36:39.868736	2026-09-18 14:36:43.665445	204.2	4.2	sold
7	4	20	100	2.1	0	2026-09-19 01:52:40.325945	2026-09-19 01:52:47.535726	102.1	2.1	sold
8	8	31	200	2.1	0	2026-09-19 01:53:30.099539	2026-09-19 01:53:34.789028	204.2	4.2	sold
9	2	87	1150	2.2	0	2026-09-19 06:28:01.669177	2026-09-19 06:28:10.584974	1175.3	25.3	sold
10	5	128	100	2.1	0	2026-09-19 06:42:09.512998	2026-09-19 06:42:17.130648	102.1	2.1	sold
11	7	101	102	2.1	0	2026-09-19 07:10:14.464451	2026-09-19 07:10:19.471765	104.142	2.142	sold
12	4	20	100	2.1	0	2026-09-20 01:48:49.815913	2026-09-20 01:48:53.85135	102.1	2.1	sold
13	8	31	200	2.1	0	2026-09-20 01:49:40.458445	2026-09-20 01:49:43.758142	204.2	4.2	sold
14	7	97	104	2.1	0	2026-09-20 07:35:25.865906	2026-09-20 07:35:30.706147	106.184	2.184	sold
15	2	87	1150	2.2	0	2026-09-20 16:20:14.078261	2026-09-20 16:20:17.836162	1175.3	25.3	sold
16	4	143	139	2.1	0	2026-09-21 01:54:31.222158	2026-09-21 01:54:59.624753	141.919	2.919	sold
17	8	31	200	2.1	0	2026-09-21 01:55:30.566539	2026-09-21 01:55:34.220674	204.2	4.2	sold
18	5	164	103	2.1	0	2026-09-21 02:21:27.930099	2026-09-21 02:21:33.456402	105.163	2.163	sold
19	2	87	1150	2.2	0	2026-09-21 06:45:27.791779	2026-09-21 06:45:31.712855	1175.3	25.3	sold
20	7	98	105	2.1	0	2026-09-21 07:38:04.004321	2026-09-21 07:38:14.753675	107.205	2.205	sold
21	5	121	108	2.1	0	2026-09-22 04:19:27.777319	2026-09-22 04:19:31.511538	110.268	2.268	sold
22	8	31	200	2.1	0	2026-09-22 05:01:14.97724	2026-09-22 05:01:18.467686	204.2	4.2	sold
23	4	144	141	2.1	0	2026-09-22 05:01:49.563564	2026-09-22 05:02:02.403788	143.961	2.961	sold
24	2	88	1200	2.3	0	2026-09-22 05:33:06.545502	2026-09-22 05:33:11.562231	1227.6	27.6	sold
25	7	99	108	2.1	0	2026-09-22 07:41:03.399934	2026-09-22 07:41:08.885369	110.268	2.268	sold
26	14	129	30	2.1	0	2026-09-22 07:47:26.523312	2026-09-22 07:55:14.224754	30.63	0.63	sold
27	14	1	30	1.9	0	2026-09-23 02:55:00.084364	2026-09-23 02:55:28.608378	30.57	0.57	sold
28	8	32	210	2.2	0	2026-09-23 05:03:40.963222	2026-09-23 05:03:47.783298	214.62	4.62	sold
29	4	146	144	2.1	0	2026-09-23 05:04:25.187485	2026-09-23 05:04:30.179658	147.024	3.024	sold
30	7	21	110	2.1	0	2026-09-23 07:44:54.747068	2026-09-23 07:44:58.823511	112.31	2.31	sold
31	2	88	1200	2.3	0	2026-09-23 10:21:06.928548	2026-09-23 10:21:14.736721	1227.6	27.6	sold
32	8	32	210	2.2	0	2026-09-24 04:26:20.385716	2026-09-24 04:26:23.881082	214.62	4.62	sold
33	4	147	146	2.1	0	2026-09-24 04:26:52.521175	2026-09-24 04:26:57.321498	149.066	3.066	sold
34	7	132	112	2.1	0	2026-09-24 07:47:18.55058	2026-09-24 07:47:23.298802	114.352	2.352	sold
35	14	129	30	2.1	0	2026-09-24 08:19:05.91443	2026-09-24 08:19:14.505062	30.63	0.63	sold
36	2	89	1250	2.3	0	2026-09-24 08:30:01.731328	2026-09-24 08:30:11.960444	1278.75	28.75	sold
\.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_sessions (sid, sess, expire) FROM stdin;
kVBx10qi37y5M0nEbvSZ-BFDyxLDmD0T	{"cookie":{"originalMaxAge":86400000,"expires":"2026-09-25T18:14:46.905Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":14,"isAdmin":false}	2026-09-25 18:14:47
76ACn-Vnw36i0jcgm91xXdGU4VSxkj_Q	{"cookie":{"originalMaxAge":86400000,"expires":"2026-09-25T14:36:03.259Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":14,"isAdmin":false}	2026-09-25 14:36:11
-JF2F1hYda3tt-Aih39iXBNh8lYVun_Q	{"cookie":{"originalMaxAge":86400000,"expires":"2026-09-25T18:18:08.814Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":14,"isAdmin":false}	2026-09-25 18:18:21
Dpo42HB43jnbSU_bm93M59EwwE8-sdX4	{"cookie":{"originalMaxAge":86400000,"expires":"2026-09-26T13:41:58.248Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":3,"isAdmin":false}	2026-09-26 13:42:16
8acfGJrSjewdnWGRqx2gQdJG_YXFeSLR	{"cookie":{"originalMaxAge":86400000,"expires":"2026-09-25T04:26:36.695Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":4,"isAdmin":false}	2026-09-25 16:37:35
O-MjI_QXAGO5u1j0xlnsWMhld8GNh5rf	{"cookie":{"originalMaxAge":86400000,"expires":"2026-09-25T17:43:53.213Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":22,"isAdmin":false}	2026-09-25 17:47:35
8oA4axta34pyfKhgmpQR8pTwBT94xzJh	{"cookie":{"originalMaxAge":86400000,"expires":"2026-09-25T14:24:54.463Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":8,"isAdmin":false}	2026-09-25 14:29:30
nTjv3UxrgDv2Xwc--dJbvu6oLedddk51	{"cookie":{"originalMaxAge":86400000,"expires":"2026-09-25T17:48:46.417Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":22,"isAdmin":false}	2026-09-25 17:54:02
dZFYBZQe5bBRWPaGqs687FlD5ODgOaCh	{"cookie":{"originalMaxAge":86400000,"expires":"2026-09-25T17:43:25.583Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"isAdmin":true,"userId":null}	2026-09-25 18:19:49
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, email, password, balance, referral_code, referred_by, created_at, is_blocked) FROM stdin;
22	Muhammadfaheemhaider	haiderfaheem635@gmail.com	$2a$12$6LqROfxJX1pUSrEyYndrbuhmp0qn9xRgUL4YpNuuZaV.jhK3Y3wrG	0	JI2R7JKOVN	14	2026-09-24 17:43:45.405806	f
17	Farhan	f40893083@gmail.com	$2a$12$7bqgNjYhiuj9.qu59HOOQORfO1unkGKGtyunF1qQsLq3XFyMBQVRy	0	WUN41I6O37	14	2026-09-22 13:02:31.624221	f
18	Sharafat	liaqatabbas005@gmail.com	$2a$12$yKcICWwR4fX9Lbp7WYCtj.gQ5zXnqaGabrAWX4J0td4kRGKNochx6	0	A054J1NKGG	14	2026-09-22 16:07:10.39451	f
1	Aizal	aizalqueen034@gmail.com	$2a$12$361YYIXK0B.4no.wTYzG3e761q2tc0JIA2I/zELcvsmdwlvrElUR2	10	VX7BNK23IM	\N	2026-08-30 09:11:36.504842	f
9	Muhammad Umair Arshad	rumair2023@gmail.com	$2a$12$ZxGhpEZ4KNpu5YtA/76oC.egvqg6GQVwwzp7MnPkunsXWc.xao8NG	0	BQQNE23HPT	4	2026-09-18 12:06:45.009527	f
10	Akhlaq	akhlaqhussainqureshi8@gmail.com	$2a$12$EHxFLfkurP/IktxI/xKICeloeh5yqFrv/DCqytQxGJsxgtJ2BcZYK	0	T6EP37RL11	8	2026-09-18 15:49:22.320416	f
11	Rami123	mshafiqg7477@gmail.com	$2a$12$SCI.fiigQ77Kr9egvZ5yYuTzADcS03ut3pvBRGbpMItfBSuW/k3z6	0	O9HLBV91NH	\N	2026-09-18 18:01:30.430502	f
12	Zs ansari	zohaibsahil1997@gmail.com	$2a$12$/l5vhs2GPR2IbClkBbOEquqg/SUcfluIPwkzrUpy8/hVQ3w6fenOq	0	5OUYLPJ7YU	4	2026-09-18 18:10:14.02855	f
13	Raja Saif Ali	rajasaifali4444@gmail.com	$2a$12$J5yu/5Xbkwwu9GsZo7efEu/vny3rXa3pobic3eXFiZem3iF.6gxnO	0	O9AROWBW25	\N	2026-09-18 23:06:57.744109	f
5	Sadaf Rehman	paglugirl1234@gmail.com	$2a$12$HMnAn5nnqXs2880LhaDayO8dWVbgdOYhLyqK3p.KAruNAMOy4KrK2	110.481818	0PQNO98Q5Q	2	2026-09-10 04:23:07.141429	t
15	Hassan	veerzad.007@gmail.com	$2a$12$m1wUGxpqqfAbPin5EgUJjupOiRajiJHG4T97HiDJ080YEidaLR5Va	0	PANVEC6JU0	\N	2026-09-21 09:32:18.580368	f
16	Sardar Mumtaz	sardarmumtaz561@gmail.com	$2a$12$70TmA1dNh3.GHB.YKFpEEeScmwc.VWHgn4P7JYWNGSBHHzOMEz/IG	0	3YTK8DM58F	\N	2026-09-21 13:46:18.611243	f
8	Minety	minety017@gmail.com	$2a$12$ZZWmgooHsTV62wJR1CWG9.nXLImaoUq7BEwlye6/iIsUVQy8X.n1O	222.24	IWA6431QY2	4	2026-09-18 06:55:31.441295	f
3	Shafqat Shahzad	shafqatshahzad99@gmail.com	$2a$12$msBj.dzes1pzEd/1Voqh7Ob/wPl.t.4ly76DcVGh3GnzJjBkLrZe6	0	YIHNL12BD8	2	2026-08-31 10:17:51.156133	f
4	Kanwal Shaheen	kanwalshaheen7304142@gmail.com	$2a$12$e1l6FWdhxozQD4y0c0w09eVJQJ2DLasa/jr8ibphBpMdINzpZ1EDS	151.000662	XLSRIMO2CA	2	2026-09-07 19:34:16.766751	f
6	Akhlaq	akhlaqqureshi16@gmail.com	$2a$12$phslAAjKFKKZYkMcEjBWc.5l0/oHdaut4qg9mPtYh0.N3v.MhR4Qi	0	1SF8GNSSPU	4	2026-09-14 18:12:55.909511	f
19	Eman Fatima	eman.fatima4t8@gmail.com	$2a$12$SVehPl/ZjBBWXHVb1STzlO7QEFPCPBMwfv0jf4RiW32pbH/ieeewC	0	ZOC7UCYSHU	14	2026-09-24 06:29:52.376087	f
7	Rubina kousar	noori4052017@gmail.com	$2a$12$Sto1q54pX21IIQ3Af7/KwuzsOXTwOA/SVybI1m3CXtEzafqMKsvCC	115.561	OKBOONQUBQ	2	2026-09-18 06:44:54.538721	f
14	Malik	nouraizmalik03@gmail.com	$2a$12$WJvzdHJezTTQ3dqkrynGYO6X.Cjj96vREZzGRXDQ5NAPebxUh0Cxa	31.83	R77E2Q7R7I	2	2026-09-21 05:57:50.324495	f
2	USAMA	usamakingg034@gmail.com	$2a$12$HKR90cuI/Zc7MbrfHYJSneV8b4yA7gBPPD4CJZoA7R1GH.JXrlDIO	1300.415808	1GNVBKP29Z	1	2026-08-30 15:53:44.799634	f
20	Waqas Ahmed	waqasimalik322@gmail.com	$2a$12$bXVp7W.uvLtpr5aiW/kj2.NBYZ5DfPCC0UNVeAtbzmlqdG2IajVju	0	1MOF7A87MR	14	2026-09-24 10:20:16.531532	f
21	Shahzaib	malikshahzaib1157368@gmail.com	$2a$12$f1pVoEG4qCZcwwVLMVr/VeEZViDSlyWl/cfZrF/sLXtnpjfB8o6ka	0	OJQR7E488G	14	2026-09-24 10:30:48.64832	f
\.


--
-- Data for Name: withdrawals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.withdrawals (id, user_id, amount, network, wallet_address, status, created_at) FROM stdin;
1	1	100	BEP20	Uuuuuuuuu	approved	2026-08-30 15:59:28.757285
2	2	50	BEP20	0x05bBa7081e52638bCF47304c1a7de64EfBe5ac12	approved	2026-09-07 19:42:38.750274
3	2	20	BEP20	0x05bBa7081e52638bCF47304c1a7de64EfBe5ac12	approved	2026-09-07 19:49:16.717977
4	4	34	BEP20	0x2Fbb58d1fF7253316884Df3D9a286c072A1C6dF9	rejected	2026-09-18 15:28:49.059966
6	8	8	BEP20	0x2Fbb58d1fF7253316884Df3D9a286c072A1C6dF9	approved	2026-09-19 13:21:41.880411
7	2	40	BEP20	0x8c3093f27be5688a782c57965d184d0ef02875ba	approved	2026-09-19 16:39:56.886766
5	4	36.93	BEP20	0x2Fbb58d1fF7253316884Df3D9a286c072A1C6dF9	approved	2026-09-19 11:32:56.847939
\.


--
-- Name: deposits_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.deposits_id_seq', 8, true);


--
-- Name: earnings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.earnings_id_seq', 40, true);


--
-- Name: email_otps_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.email_otps_id_seq', 33, true);


--
-- Name: landing_nfts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.landing_nfts_id_seq', 3, true);


--
-- Name: nft_sales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.nft_sales_id_seq', 36, true);


--
-- Name: nfts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.nfts_id_seq', 168, true);


--
-- Name: referral_bonuses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.referral_bonuses_id_seq', 6, true);


--
-- Name: reservations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.reservations_id_seq', 63, true);


--
-- Name: site_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.site_settings_id_seq', 2, true);


--
-- Name: user_nfts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_nfts_id_seq', 36, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 22, true);


--
-- Name: withdrawals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.withdrawals_id_seq', 7, true);


--
-- Name: deposits deposits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deposits
    ADD CONSTRAINT deposits_pkey PRIMARY KEY (id);


--
-- Name: deposits deposits_tx_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deposits
    ADD CONSTRAINT deposits_tx_hash_key UNIQUE (tx_hash);


--
-- Name: earnings earnings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.earnings
    ADD CONSTRAINT earnings_pkey PRIMARY KEY (id);


--
-- Name: email_otps email_otps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_otps
    ADD CONSTRAINT email_otps_pkey PRIMARY KEY (id);


--
-- Name: landing_nfts landing_nfts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.landing_nfts
    ADD CONSTRAINT landing_nfts_pkey PRIMARY KEY (id);


--
-- Name: nft_sales nft_sales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nft_sales
    ADD CONSTRAINT nft_sales_pkey PRIMARY KEY (id);


--
-- Name: nfts nfts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nfts
    ADD CONSTRAINT nfts_pkey PRIMARY KEY (id);


--
-- Name: referral_bonuses referral_bonuses_deposit_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_bonuses
    ADD CONSTRAINT referral_bonuses_deposit_id_key UNIQUE (deposit_id);


--
-- Name: referral_bonuses referral_bonuses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_bonuses
    ADD CONSTRAINT referral_bonuses_pkey PRIMARY KEY (id);


--
-- Name: reservations reservations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_pkey PRIMARY KEY (id);


--
-- Name: user_sessions session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: site_settings site_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_pkey PRIMARY KEY (id);


--
-- Name: site_settings site_settings_setting_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_setting_key_key UNIQUE (setting_key);


--
-- Name: user_nfts user_nfts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_nfts
    ADD CONSTRAINT user_nfts_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_referral_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_referral_code_key UNIQUE (referral_code);


--
-- Name: withdrawals withdrawals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.withdrawals
    ADD CONSTRAINT withdrawals_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_session_expire" ON public.user_sessions USING btree (expire);


--
-- Name: idx_deposits_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deposits_user_id ON public.deposits USING btree (user_id);


--
-- Name: idx_earnings_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_earnings_type ON public.earnings USING btree (type);


--
-- Name: idx_earnings_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_earnings_user_id ON public.earnings USING btree (user_id);


--
-- Name: idx_email_otps_email_purpose; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_otps_email_purpose ON public.email_otps USING btree (email, purpose);


--
-- Name: idx_email_otps_user_purpose; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_otps_user_purpose ON public.email_otps USING btree (user_id, purpose);


--
-- Name: idx_nft_sales_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nft_sales_user_id ON public.nft_sales USING btree (user_id);


--
-- Name: idx_nfts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nfts_status ON public.nfts USING btree (status);


--
-- Name: idx_referral_bonuses_referrer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_referral_bonuses_referrer_id ON public.referral_bonuses USING btree (referrer_id);


--
-- Name: idx_reservations_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reservations_user_id ON public.reservations USING btree (user_id);


--
-- Name: idx_user_nfts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_nfts_status ON public.user_nfts USING btree (status);


--
-- Name: idx_user_nfts_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_nfts_user_id ON public.user_nfts USING btree (user_id);


--
-- Name: idx_users_referred_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_referred_by ON public.users USING btree (referred_by);


--
-- Name: idx_withdrawals_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_withdrawals_user_id ON public.withdrawals USING btree (user_id);


--
-- PostgreSQL database dump complete
--

\unrestrict V6J0KzSyCgyCPfXwOHmK93kvs4g90H1OzrkLY9ZFNbwHL0VmtztdhHjpIJULXWb

