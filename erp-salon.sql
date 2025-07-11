PGDMP  *    ;                }         	   erp_salon    17.4    17.4 e   M           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                           false            N           0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                           false            O           0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                           false            P           1262    24880 	   erp_salon    DATABASE     o   CREATE DATABASE erp_salon WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en-PH';
    DROP DATABASE erp_salon;
                     postgres    false                        3079    34011    pgcrypto 	   EXTENSION     <   CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;
    DROP EXTENSION pgcrypto;
                        false            Q           0    0    EXTENSION pgcrypto    COMMENT     <   COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';
                             false    2            *           1255    33779    archive_appointment()    FUNCTION     �  CREATE FUNCTION public.archive_appointment() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO archived_appointments (
      original_id, customer_data, service_id, employee_id, branch_id,
      appointment_date, duration, status, notes, archive_reason
    ) VALUES (
      OLD.appointment_id,
      jsonb_build_object(
        'first_name', OLD.customer_first_name,
        'last_name', OLD.customer_last_name,
        'phone', OLD.customer_phone,
        'email', OLD.customer_email
      ),
      OLD.service_id,
      OLD.employee_id,
      OLD.branch_id,
      OLD.appointment_date,
      OLD.duration,
      OLD.status,
      OLD.notes,
      CASE 
        WHEN OLD.status = 'Completed' THEN 'completed'
        WHEN OLD.status = 'Cancelled' THEN 'cancelled'
        ELSE 'deleted'
      END
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;
 ,   DROP FUNCTION public.archive_appointment();
       public               postgres    false            &           1255    25561    generate_receipt_number()    FUNCTION     �   CREATE FUNCTION public.generate_receipt_number() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.receipt_number := 'RCP-' || TO_CHAR(NEW.transaction_id, 'FM000000');
  RETURN NEW;
END;
$$;
 0   DROP FUNCTION public.generate_receipt_number();
       public               postgres    false            '           1255    34002    update_last_updated_column()    FUNCTION     �   CREATE FUNCTION public.update_last_updated_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.last_updated = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;
 3   DROP FUNCTION public.update_last_updated_column();
       public               postgres    false            %           1255    33812    update_timestamp()    FUNCTION     �   CREATE FUNCTION public.update_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
 )   DROP FUNCTION public.update_timestamp();
       public               postgres    false            �            1259    25174    appointments    TABLE     �  CREATE TABLE public.appointments (
    appointment_id integer NOT NULL,
    customer_id integer,
    service_id integer,
    employee_id integer,
    appointment_date timestamp without time zone NOT NULL,
    duration integer,
    status character varying(20) DEFAULT 'Scheduled'::character varying,
    reminder_sent boolean DEFAULT false,
    notes text,
    branch_id integer,
    customer_first_name character varying(50),
    customer_last_name character varying(50),
    customer_phone character varying(20),
    customer_email character varying(100),
    updated_at timestamp with time zone,
    downpayment numeric(10,2) DEFAULT 0
);
     DROP TABLE public.appointments;
       public         heap r       postgres    false            �            1259    25173    appointments_appointment_id_seq    SEQUENCE     �   CREATE SEQUENCE public.appointments_appointment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 6   DROP SEQUENCE public.appointments_appointment_id_seq;
       public               postgres    false    239            R           0    0    appointments_appointment_id_seq    SEQUENCE OWNED BY     c   ALTER SEQUENCE public.appointments_appointment_id_seq OWNED BY public.appointments.appointment_id;
          public               postgres    false    238                       1259    33754    archived_appointments    TABLE     �  CREATE TABLE public.archived_appointments (
    archive_id integer NOT NULL,
    original_id integer,
    customer_data jsonb NOT NULL,
    service_id integer,
    employee_id integer,
    branch_id integer,
    appointment_date timestamp without time zone NOT NULL,
    duration integer NOT NULL,
    status character varying(20) NOT NULL,
    notes text,
    archived_at timestamp without time zone DEFAULT now(),
    archive_reason character varying(20) NOT NULL,
    CONSTRAINT archived_appointments_archive_reason_check CHECK (((archive_reason)::text = ANY ((ARRAY['completed'::character varying, 'cancelled'::character varying, 'deleted'::character varying])::text[])))
);
 )   DROP TABLE public.archived_appointments;
       public         heap r       postgres    false                       1259    33753 $   archived_appointments_archive_id_seq    SEQUENCE     �   CREATE SEQUENCE public.archived_appointments_archive_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 ;   DROP SEQUENCE public.archived_appointments_archive_id_seq;
       public               postgres    false    276            S           0    0 $   archived_appointments_archive_id_seq    SEQUENCE OWNED BY     m   ALTER SEQUENCE public.archived_appointments_archive_id_seq OWNED BY public.archived_appointments.archive_id;
          public               postgres    false    275            �            1259    25241 
   attendance    TABLE     �   CREATE TABLE public.attendance (
    attendance_id integer NOT NULL,
    employee_id integer,
    date date NOT NULL,
    time_in timestamp without time zone,
    time_out timestamp without time zone
);
    DROP TABLE public.attendance;
       public         heap r       postgres    false            �            1259    25240    attendance_attendance_id_seq    SEQUENCE     �   CREATE SEQUENCE public.attendance_attendance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 3   DROP SEQUENCE public.attendance_attendance_id_seq;
       public               postgres    false    245            T           0    0    attendance_attendance_id_seq    SEQUENCE OWNED BY     ]   ALTER SEQUENCE public.attendance_attendance_id_seq OWNED BY public.attendance.attendance_id;
          public               postgres    false    244            �            1259    25200    branch_inventory    TABLE     �   CREATE TABLE public.branch_inventory (
    inventory_id integer NOT NULL,
    branch_id integer,
    product_id integer,
    quantity integer DEFAULT 0 NOT NULL,
    last_updated timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
 $   DROP TABLE public.branch_inventory;
       public         heap r       postgres    false            �            1259    25199 !   branch_inventory_inventory_id_seq    SEQUENCE     �   CREATE SEQUENCE public.branch_inventory_inventory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 8   DROP SEQUENCE public.branch_inventory_inventory_id_seq;
       public               postgres    false    241            U           0    0 !   branch_inventory_inventory_id_seq    SEQUENCE OWNED BY     g   ALTER SEQUENCE public.branch_inventory_inventory_id_seq OWNED BY public.branch_inventory.inventory_id;
          public               postgres    false    240            �            1259    25086    branches    TABLE     L  CREATE TABLE public.branches (
    branch_id integer NOT NULL,
    branch_name character varying(100) NOT NULL,
    location character varying(255) NOT NULL,
    contact_number character varying(20),
    manager_id integer,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
    DROP TABLE public.branches;
       public         heap r       postgres    false            �            1259    25085    branches_branch_id_seq    SEQUENCE     �   CREATE SEQUENCE public.branches_branch_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 -   DROP SEQUENCE public.branches_branch_id_seq;
       public               postgres    false    227            V           0    0    branches_branch_id_seq    SEQUENCE OWNED BY     Q   ALTER SEQUENCE public.branches_branch_id_seq OWNED BY public.branches.branch_id;
          public               postgres    false    226            �            1259    25118 
   categories    TABLE     �   CREATE TABLE public.categories (
    category_id integer NOT NULL,
    category_name character varying(100) NOT NULL,
    description text,
    parent_category_id integer
);
    DROP TABLE public.categories;
       public         heap r       postgres    false            �            1259    25117    categories_category_id_seq    SEQUENCE     �   CREATE SEQUENCE public.categories_category_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 1   DROP SEQUENCE public.categories_category_id_seq;
       public               postgres    false    231            W           0    0    categories_category_id_seq    SEQUENCE OWNED BY     Y   ALTER SEQUENCE public.categories_category_id_seq OWNED BY public.categories.category_id;
          public               postgres    false    230                       1259    25418    chart_of_accounts    TABLE     8  CREATE TABLE public.chart_of_accounts (
    account_id integer NOT NULL,
    account_code character varying(20) NOT NULL,
    account_name character varying(100) NOT NULL,
    account_type character varying(50) NOT NULL,
    parent_account_id integer,
    is_active boolean DEFAULT true,
    description text
);
 %   DROP TABLE public.chart_of_accounts;
       public         heap r       postgres    false                       1259    25417     chart_of_accounts_account_id_seq    SEQUENCE     �   CREATE SEQUENCE public.chart_of_accounts_account_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 7   DROP SEQUENCE public.chart_of_accounts_account_id_seq;
       public               postgres    false    263            X           0    0     chart_of_accounts_account_id_seq    SEQUENCE OWNED BY     e   ALTER SEQUENCE public.chart_of_accounts_account_id_seq OWNED BY public.chart_of_accounts.account_id;
          public               postgres    false    262            �            1259    25322    customer_communications    TABLE     K  CREATE TABLE public.customer_communications (
    communication_id integer NOT NULL,
    customer_id integer,
    communication_type character varying(20),
    subject character varying(255),
    message text,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    follow_up_date date
);
 +   DROP TABLE public.customer_communications;
       public         heap r       postgres    false            �            1259    25321 ,   customer_communications_communication_id_seq    SEQUENCE     �   CREATE SEQUENCE public.customer_communications_communication_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 C   DROP SEQUENCE public.customer_communications_communication_id_seq;
       public               postgres    false    253            Y           0    0 ,   customer_communications_communication_id_seq    SEQUENCE OWNED BY     }   ALTER SEQUENCE public.customer_communications_communication_id_seq OWNED BY public.customer_communications.communication_id;
          public               postgres    false    252            �            1259    25296    customer_feedbacks    TABLE     �  CREATE TABLE public.customer_feedbacks (
    feedback_id integer NOT NULL,
    customer_id integer,
    appointment_id integer,
    rating integer,
    comments text,
    feedback_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    responded_by integer,
    response text,
    response_date timestamp without time zone,
    CONSTRAINT customer_feedbacks_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);
 &   DROP TABLE public.customer_feedbacks;
       public         heap r       postgres    false            �            1259    25295 "   customer_feedbacks_feedback_id_seq    SEQUENCE     �   CREATE SEQUENCE public.customer_feedbacks_feedback_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 9   DROP SEQUENCE public.customer_feedbacks_feedback_id_seq;
       public               postgres    false    251            Z           0    0 "   customer_feedbacks_feedback_id_seq    SEQUENCE OWNED BY     i   ALTER SEQUENCE public.customer_feedbacks_feedback_id_seq OWNED BY public.customer_feedbacks.feedback_id;
          public               postgres    false    250            �            1259    25149 	   customers    TABLE     1  CREATE TABLE public.customers (
    customer_id integer NOT NULL,
    first_name character varying(50) NOT NULL,
    last_name character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    phone character varying(20) NOT NULL,
    password text NOT NULL,
    assigned_staff_id integer
);
    DROP TABLE public.customers;
       public         heap r       postgres    false            �            1259    25148    customers_customer_id_seq    SEQUENCE     �   CREATE SEQUENCE public.customers_customer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 0   DROP SEQUENCE public.customers_customer_id_seq;
       public               postgres    false    235            [           0    0    customers_customer_id_seq    SEQUENCE OWNED BY     W   ALTER SEQUENCE public.customers_customer_id_seq OWNED BY public.customers.customer_id;
          public               postgres    false    234                       1259    33791    employee_credentials    TABLE     �   CREATE TABLE public.employee_credentials (
    id integer NOT NULL,
    employee_user_id integer NOT NULL,
    pin_hash text NOT NULL,
    face_image_path text NOT NULL
);
 (   DROP TABLE public.employee_credentials;
       public         heap r       postgres    false                       1259    33790    employee_credentials_id_seq    SEQUENCE     �   CREATE SEQUENCE public.employee_credentials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 2   DROP SEQUENCE public.employee_credentials_id_seq;
       public               postgres    false    278            \           0    0    employee_credentials_id_seq    SEQUENCE OWNED BY     [   ALTER SEQUENCE public.employee_credentials_id_seq OWNED BY public.employee_credentials.id;
          public               postgres    false    277            $           1259    34137    employee_schedule    TABLE     �   CREATE TABLE public.employee_schedule (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    day_of_week integer,
    start_time time without time zone,
    end_time time without time zone,
    is_available boolean DEFAULT true
);
 %   DROP TABLE public.employee_schedule;
       public         heap r       postgres    false            #           1259    34136    employee_schedule_id_seq    SEQUENCE     �   CREATE SEQUENCE public.employee_schedule_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 /   DROP SEQUENCE public.employee_schedule_id_seq;
       public               postgres    false    292            ]           0    0    employee_schedule_id_seq    SEQUENCE OWNED BY     U   ALTER SEQUENCE public.employee_schedule_id_seq OWNED BY public.employee_schedule.id;
          public               postgres    false    291                       1259    25532    employee_services    TABLE     m   CREATE TABLE public.employee_services (
    employee_id integer NOT NULL,
    service_id integer NOT NULL
);
 %   DROP TABLE public.employee_services;
       public         heap r       postgres    false            �            1259    25106 	   employees    TABLE     `  CREATE TABLE public.employees (
    employee_id integer NOT NULL,
    first_name character varying(50) NOT NULL,
    last_name character varying(50) NOT NULL,
    "position" character varying(100),
    hire_date date,
    base_salary numeric(12,2),
    user_id integer,
    branch_id integer,
    is_active boolean DEFAULT true,
    birth_date date
);
    DROP TABLE public.employees;
       public         heap r       postgres    false            �            1259    25105    employees_employee_id_seq    SEQUENCE     �   CREATE SEQUENCE public.employees_employee_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 0   DROP SEQUENCE public.employees_employee_id_seq;
       public               postgres    false    229            ^           0    0    employees_employee_id_seq    SEQUENCE OWNED BY     W   ALTER SEQUENCE public.employees_employee_id_seq OWNED BY public.employees.employee_id;
          public               postgres    false    228                        1259    34106    expense_summary    TABLE     *  CREATE TABLE public.expense_summary (
    id integer NOT NULL,
    branch_id integer NOT NULL,
    year integer NOT NULL,
    month integer NOT NULL,
    rent numeric(10,2) NOT NULL,
    internet numeric(10,2) NOT NULL,
    payroll_expense numeric(10,2) NOT NULL,
    supplies numeric(10,2) NOT NULL,
    water numeric(10,2) NOT NULL,
    electricity numeric(10,2) NOT NULL,
    total_expense numeric(10,2) NOT NULL,
    created_at time without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
 #   DROP TABLE public.expense_summary;
       public         heap r       postgres    false                       1259    34105    expense_summary_id_seq    SEQUENCE     �   CREATE SEQUENCE public.expense_summary_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 -   DROP SEQUENCE public.expense_summary_id_seq;
       public               postgres    false    288            _           0    0    expense_summary_id_seq    SEQUENCE OWNED BY     Q   ALTER SEQUENCE public.expense_summary_id_seq OWNED BY public.expense_summary.id;
          public               postgres    false    287            	           1259    25435    general_ledger    TABLE     �  CREATE TABLE public.general_ledger (
    entry_id integer NOT NULL,
    account_id integer,
    transaction_date date NOT NULL,
    reference_type character varying(50),
    reference_id integer,
    debit_amount numeric(12,2) DEFAULT 0,
    credit_amount numeric(12,2) DEFAULT 0,
    balance numeric(12,2) NOT NULL,
    description text,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
 "   DROP TABLE public.general_ledger;
       public         heap r       postgres    false                       1259    25434    general_ledger_entry_id_seq    SEQUENCE     �   CREATE SEQUENCE public.general_ledger_entry_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 2   DROP SEQUENCE public.general_ledger_entry_id_seq;
       public               postgres    false    265            `           0    0    general_ledger_entry_id_seq    SEQUENCE OWNED BY     [   ALTER SEQUENCE public.general_ledger_entry_id_seq OWNED BY public.general_ledger.entry_id;
          public               postgres    false    264            �            1259    25271    inventory_transactions    TABLE     �  CREATE TABLE public.inventory_transactions (
    transaction_id integer NOT NULL,
    product_id integer,
    branch_id integer,
    transaction_type character varying(20) NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric(12,2),
    reference_id character varying(100),
    notes text,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
 *   DROP TABLE public.inventory_transactions;
       public         heap r       postgres    false            �            1259    25270 )   inventory_transactions_transaction_id_seq    SEQUENCE     �   CREATE SEQUENCE public.inventory_transactions_transaction_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 @   DROP SEQUENCE public.inventory_transactions_transaction_id_seq;
       public               postgres    false    249            a           0    0 )   inventory_transactions_transaction_id_seq    SEQUENCE OWNED BY     w   ALTER SEQUENCE public.inventory_transactions_transaction_id_seq OWNED BY public.inventory_transactions.transaction_id;
          public               postgres    false    248                       1259    25457    journal_entries    TABLE     �  CREATE TABLE public.journal_entries (
    journal_id integer NOT NULL,
    entry_date date NOT NULL,
    reference_number character varying(50),
    description text,
    total_debit numeric(12,2) NOT NULL,
    total_credit numeric(12,2) NOT NULL,
    status character varying(20) DEFAULT 'Draft'::character varying,
    posted_by integer,
    posted_at timestamp without time zone,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
 #   DROP TABLE public.journal_entries;
       public         heap r       postgres    false            
           1259    25456    journal_entries_journal_id_seq    SEQUENCE     �   CREATE SEQUENCE public.journal_entries_journal_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 5   DROP SEQUENCE public.journal_entries_journal_id_seq;
       public               postgres    false    267            b           0    0    journal_entries_journal_id_seq    SEQUENCE OWNED BY     a   ALTER SEQUENCE public.journal_entries_journal_id_seq OWNED BY public.journal_entries.journal_id;
          public               postgres    false    266                       1259    25480    journal_entry_items    TABLE     �   CREATE TABLE public.journal_entry_items (
    item_id integer NOT NULL,
    journal_id integer,
    account_id integer,
    debit_amount numeric(12,2) DEFAULT 0,
    credit_amount numeric(12,2) DEFAULT 0,
    description text
);
 '   DROP TABLE public.journal_entry_items;
       public         heap r       postgres    false                       1259    25479    journal_entry_items_item_id_seq    SEQUENCE     �   CREATE SEQUENCE public.journal_entry_items_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 6   DROP SEQUENCE public.journal_entry_items_item_id_seq;
       public               postgres    false    269            c           0    0    journal_entry_items_item_id_seq    SEQUENCE OWNED BY     c   ALTER SEQUENCE public.journal_entry_items_item_id_seq OWNED BY public.journal_entry_items.item_id;
          public               postgres    false    268            "           1259    34120 
   net_income    TABLE     �   CREATE TABLE public.net_income (
    id integer NOT NULL,
    branch_id integer NOT NULL,
    year integer NOT NULL,
    month integer NOT NULL,
    net_income numeric(10,2) NOT NULL,
    created_at timestamp with time zone
);
    DROP TABLE public.net_income;
       public         heap r       postgres    false            !           1259    34119    net_income_id_seq    SEQUENCE     �   CREATE SEQUENCE public.net_income_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 (   DROP SEQUENCE public.net_income_id_seq;
       public               postgres    false    290            d           0    0    net_income_id_seq    SEQUENCE OWNED BY     G   ALTER SEQUENCE public.net_income_id_seq OWNED BY public.net_income.id;
          public               postgres    false    289                       1259    25516    notifications    TABLE     W  CREATE TABLE public.notifications (
    notification_id integer NOT NULL,
    user_id integer,
    title character varying(100) NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    notification_type character varying(50),
    reference_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
 !   DROP TABLE public.notifications;
       public         heap r       postgres    false                       1259    25515 !   notifications_notification_id_seq    SEQUENCE     �   CREATE SEQUENCE public.notifications_notification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 8   DROP SEQUENCE public.notifications_notification_id_seq;
       public               postgres    false    273            e           0    0 !   notifications_notification_id_seq    SEQUENCE OWNED BY     g   ALTER SEQUENCE public.notifications_notification_id_seq OWNED BY public.notifications.notification_id;
          public               postgres    false    272            �            1259    25219    payroll    TABLE     �  CREATE TABLE public.payroll (
    payroll_id integer NOT NULL,
    employee_id integer,
    payroll_date date NOT NULL,
    gross_pay numeric(10,2) NOT NULL,
    net_pay numeric(10,2) DEFAULT 0,
    working_days integer DEFAULT 0,
    days_worked integer DEFAULT 0,
    deductions numeric(10,2) NOT NULL,
    cutoff_start date,
    cutoff_end date,
    status boolean DEFAULT false,
    branch_id integer
);
    DROP TABLE public.payroll;
       public         heap r       postgres    false            �            1259    25218    payroll_payroll_id_seq    SEQUENCE     �   CREATE SEQUENCE public.payroll_payroll_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 -   DROP SEQUENCE public.payroll_payroll_id_seq;
       public               postgres    false    243            f           0    0    payroll_payroll_id_seq    SEQUENCE OWNED BY     Q   ALTER SEQUENCE public.payroll_payroll_id_seq OWNED BY public.payroll.payroll_id;
          public               postgres    false    242            �            1259    24975    permissions    TABLE     �   CREATE TABLE public.permissions (
    permission_id integer NOT NULL,
    permission_name character varying(100) NOT NULL,
    description text
);
    DROP TABLE public.permissions;
       public         heap r       postgres    false            �            1259    24974    permissions_permission_id_seq    SEQUENCE     �   CREATE SEQUENCE public.permissions_permission_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 4   DROP SEQUENCE public.permissions_permission_id_seq;
       public               postgres    false    221            g           0    0    permissions_permission_id_seq    SEQUENCE OWNED BY     _   ALTER SEQUENCE public.permissions_permission_id_seq OWNED BY public.permissions.permission_id;
          public               postgres    false    220                       1259    25401    pos_transaction_items    TABLE     �   CREATE TABLE public.pos_transaction_items (
    item_id integer NOT NULL,
    transaction_id integer,
    product_id integer,
    quantity integer NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    total_price numeric(12,2) NOT NULL
);
 )   DROP TABLE public.pos_transaction_items;
       public         heap r       postgres    false                       1259    25400 !   pos_transaction_items_item_id_seq    SEQUENCE     �   CREATE SEQUENCE public.pos_transaction_items_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 8   DROP SEQUENCE public.pos_transaction_items_item_id_seq;
       public               postgres    false    261            h           0    0 !   pos_transaction_items_item_id_seq    SEQUENCE OWNED BY     g   ALTER SEQUENCE public.pos_transaction_items_item_id_seq OWNED BY public.pos_transaction_items.item_id;
          public               postgres    false    260                       1259    25381    pos_transactions    TABLE       CREATE TABLE public.pos_transactions (
    transaction_id integer NOT NULL,
    branch_id integer,
    cashier_id integer,
    transaction_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    total_amount numeric(12,2) NOT NULL,
    amount_tendered numeric(12,2) NOT NULL,
    change_amount numeric(12,2) NOT NULL,
    payment_method character varying(50) NOT NULL,
    receipt_number character varying(50),
    customer_id integer,
    gcash_reference character varying(100),
    appointment_id integer
);
 $   DROP TABLE public.pos_transactions;
       public         heap r       postgres    false                       1259    25380 #   pos_transactions_transaction_id_seq    SEQUENCE     �   CREATE SEQUENCE public.pos_transactions_transaction_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 :   DROP SEQUENCE public.pos_transactions_transaction_id_seq;
       public               postgres    false    259            i           0    0 #   pos_transactions_transaction_id_seq    SEQUENCE OWNED BY     k   ALTER SEQUENCE public.pos_transactions_transaction_id_seq OWNED BY public.pos_transactions.transaction_id;
          public               postgres    false    258            �            1259    25132    products    TABLE     ~  CREATE TABLE public.products (
    product_id integer NOT NULL,
    product_name character varying(100) NOT NULL,
    description text,
    category_id integer,
    reorder_level integer,
    is_active boolean DEFAULT true,
    branch_id integer,
    updated_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    price numeric(12,2)
);
    DROP TABLE public.products;
       public         heap r       postgres    false            �            1259    25131    products_product_id_seq    SEQUENCE     �   CREATE SEQUENCE public.products_product_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 .   DROP SEQUENCE public.products_product_id_seq;
       public               postgres    false    233            j           0    0    products_product_id_seq    SEQUENCE OWNED BY     S   ALTER SEQUENCE public.products_product_id_seq OWNED BY public.products.product_id;
          public               postgres    false    232                       1259    34094    recurring_expenses    TABLE     �   CREATE TABLE public.recurring_expenses (
    id integer NOT NULL,
    branch_id integer,
    rent numeric(10,2),
    internet numeric(10,2),
    updated_at timestamp with time zone
);
 &   DROP TABLE public.recurring_expenses;
       public         heap r       postgres    false                       1259    34093    recurring_expenses_id_seq    SEQUENCE     �   CREATE SEQUENCE public.recurring_expenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 0   DROP SEQUENCE public.recurring_expenses_id_seq;
       public               postgres    false    286            k           0    0    recurring_expenses_id_seq    SEQUENCE OWNED BY     W   ALTER SEQUENCE public.recurring_expenses_id_seq OWNED BY public.recurring_expenses.id;
          public               postgres    false    285                       1259    33880    restock_requests    TABLE     �  CREATE TABLE public.restock_requests (
    id integer NOT NULL,
    product_id integer,
    branch_id integer,
    current_quantity integer NOT NULL,
    requested_quantity integer NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    requested_by integer,
    requested_at timestamp without time zone DEFAULT now() NOT NULL,
    processed_by integer,
    processed_at timestamp without time zone,
    notes text
);
 $   DROP TABLE public.restock_requests;
       public         heap r       postgres    false                       1259    33879    restock_requests_id_seq    SEQUENCE     �   CREATE SEQUENCE public.restock_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 .   DROP SEQUENCE public.restock_requests_id_seq;
       public               postgres    false    280            l           0    0    restock_requests_id_seq    SEQUENCE OWNED BY     S   ALTER SEQUENCE public.restock_requests_id_seq OWNED BY public.restock_requests.id;
          public               postgres    false    279                       1259    34082    revenue_summary    TABLE     �   CREATE TABLE public.revenue_summary (
    id integer NOT NULL,
    branch_id integer,
    date date NOT NULL,
    total_sales numeric(10,2) NOT NULL
);
 #   DROP TABLE public.revenue_summary;
       public         heap r       postgres    false                       1259    34081    revenue_summary_id_seq    SEQUENCE     �   CREATE SEQUENCE public.revenue_summary_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 -   DROP SEQUENCE public.revenue_summary_id_seq;
       public               postgres    false    284            m           0    0    revenue_summary_id_seq    SEQUENCE OWNED BY     Q   ALTER SEQUENCE public.revenue_summary_id_seq OWNED BY public.revenue_summary.id;
          public               postgres    false    283            �            1259    24986    role_permissions    TABLE     �   CREATE TABLE public.role_permissions (
    role_permission_id integer NOT NULL,
    role_id integer,
    permission_id integer
);
 $   DROP TABLE public.role_permissions;
       public         heap r       postgres    false            �            1259    24985 '   role_permissions_role_permission_id_seq    SEQUENCE     �   CREATE SEQUENCE public.role_permissions_role_permission_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 >   DROP SEQUENCE public.role_permissions_role_permission_id_seq;
       public               postgres    false    223            n           0    0 '   role_permissions_role_permission_id_seq    SEQUENCE OWNED BY     s   ALTER SEQUENCE public.role_permissions_role_permission_id_seq OWNED BY public.role_permissions.role_permission_id;
          public               postgres    false    222            �            1259    24964    roles    TABLE     �   CREATE TABLE public.roles (
    role_id integer NOT NULL,
    role_name character varying(50) NOT NULL,
    description text
);
    DROP TABLE public.roles;
       public         heap r       postgres    false            �            1259    24963    roles_role_id_seq    SEQUENCE     �   CREATE SEQUENCE public.roles_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 (   DROP SEQUENCE public.roles_role_id_seq;
       public               postgres    false    219            o           0    0    roles_role_id_seq    SEQUENCE OWNED BY     G   ALTER SEQUENCE public.roles_role_id_seq OWNED BY public.roles.role_id;
          public               postgres    false    218                       1259    25363 
   sale_items    TABLE       CREATE TABLE public.sale_items (
    sale_item_id integer NOT NULL,
    sale_id integer,
    product_id integer,
    quantity integer NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    discount_percentage numeric(5,2) DEFAULT 0,
    total_price numeric(12,2) NOT NULL
);
    DROP TABLE public.sale_items;
       public         heap r       postgres    false                        1259    25362    sale_items_sale_item_id_seq    SEQUENCE     �   CREATE SEQUENCE public.sale_items_sale_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 2   DROP SEQUENCE public.sale_items_sale_item_id_seq;
       public               postgres    false    257            p           0    0    sale_items_sale_item_id_seq    SEQUENCE OWNED BY     [   ALTER SEQUENCE public.sale_items_sale_item_id_seq OWNED BY public.sale_items.sale_item_id;
          public               postgres    false    256            �            1259    25342    sales    TABLE     �  CREATE TABLE public.sales (
    sale_id integer NOT NULL,
    customer_id integer,
    sale_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    total_amount numeric(12,2) NOT NULL,
    payment_method character varying(50),
    payment_status character varying(20) DEFAULT 'Pending'::character varying,
    discount_amount numeric(12,2) DEFAULT 0,
    tax_amount numeric(12,2) DEFAULT 0,
    created_by integer
);
    DROP TABLE public.sales;
       public         heap r       postgres    false            �            1259    25341    sales_sale_id_seq    SEQUENCE     �   CREATE SEQUENCE public.sales_sale_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 (   DROP SEQUENCE public.sales_sale_id_seq;
       public               postgres    false    255            q           0    0    sales_sale_id_seq    SEQUENCE OWNED BY     G   ALTER SEQUENCE public.sales_sale_id_seq OWNED BY public.sales.sale_id;
          public               postgres    false    254            �            1259    25164    services    TABLE     �   CREATE TABLE public.services (
    service_id integer NOT NULL,
    service_name character varying(100) NOT NULL,
    description text,
    duration integer,
    price numeric(12,2) NOT NULL,
    is_active boolean DEFAULT true
);
    DROP TABLE public.services;
       public         heap r       postgres    false            �            1259    25163    services_service_id_seq    SEQUENCE     �   CREATE SEQUENCE public.services_service_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 .   DROP SEQUENCE public.services_service_id_seq;
       public               postgres    false    237            r           0    0    services_service_id_seq    SEQUENCE OWNED BY     S   ALTER SEQUENCE public.services_service_id_seq OWNED BY public.services.service_id;
          public               postgres    false    236            �            1259    25257    shift_schedules    TABLE     �  CREATE TABLE public.shift_schedules (
    schedule_id integer NOT NULL,
    employee_id integer,
    shift_name character varying(50),
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    effective_date date NOT NULL,
    end_date date,
    is_recurring boolean DEFAULT false,
    recurring_pattern character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
 #   DROP TABLE public.shift_schedules;
       public         heap r       postgres    false            �            1259    25256    shift_schedules_schedule_id_seq    SEQUENCE     �   CREATE SEQUENCE public.shift_schedules_schedule_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 6   DROP SEQUENCE public.shift_schedules_schedule_id_seq;
       public               postgres    false    247            s           0    0    shift_schedules_schedule_id_seq    SEQUENCE OWNED BY     c   ALTER SEQUENCE public.shift_schedules_schedule_id_seq OWNED BY public.shift_schedules.schedule_id;
          public               postgres    false    246                       1259    33981    stocks    TABLE     .  CREATE TABLE public.stocks (
    id integer NOT NULL,
    product_id integer NOT NULL,
    branch_id integer NOT NULL,
    quantity integer DEFAULT 0 NOT NULL,
    last_updated timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT stocks_quantity_check CHECK ((quantity >= 0))
);
    DROP TABLE public.stocks;
       public         heap r       postgres    false                       1259    33980    stocks_id_seq    SEQUENCE     �   CREATE SEQUENCE public.stocks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 $   DROP SEQUENCE public.stocks_id_seq;
       public               postgres    false    282            t           0    0    stocks_id_seq    SEQUENCE OWNED BY     ?   ALTER SEQUENCE public.stocks_id_seq OWNED BY public.stocks.id;
          public               postgres    false    281                       1259    25501    system_logs    TABLE     A  CREATE TABLE public.system_logs (
    log_id integer NOT NULL,
    user_id integer,
    action character varying(100) NOT NULL,
    entity_type character varying(50),
    entity_id integer,
    ip_address character varying(50),
    user_agent text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
    DROP TABLE public.system_logs;
       public         heap r       postgres    false                       1259    25500    system_logs_log_id_seq    SEQUENCE     �   CREATE SEQUENCE public.system_logs_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 -   DROP SEQUENCE public.system_logs_log_id_seq;
       public               postgres    false    271            u           0    0    system_logs_log_id_seq    SEQUENCE OWNED BY     Q   ALTER SEQUENCE public.system_logs_log_id_seq OWNED BY public.system_logs.log_id;
          public               postgres    false    270            �            1259    25065    users    TABLE     ,  CREATE TABLE public.users (
    user_id integer NOT NULL,
    username character varying(50) NOT NULL,
    password_hash character varying(255) NOT NULL,
    email character varying(100) NOT NULL,
    first_name character varying(50) NOT NULL,
    last_name character varying(50) NOT NULL,
    role_id integer,
    is_active boolean DEFAULT true,
    last_login timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    branch_id integer
);
    DROP TABLE public.users;
       public         heap r       postgres    false            �            1259    25064    users_user_id_seq    SEQUENCE     �   CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 (   DROP SEQUENCE public.users_user_id_seq;
       public               postgres    false    225            v           0    0    users_user_id_seq    SEQUENCE OWNED BY     G   ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;
          public               postgres    false    224            z           2604    25177    appointments appointment_id    DEFAULT     �   ALTER TABLE ONLY public.appointments ALTER COLUMN appointment_id SET DEFAULT nextval('public.appointments_appointment_id_seq'::regclass);
 J   ALTER TABLE public.appointments ALTER COLUMN appointment_id DROP DEFAULT;
       public               postgres    false    239    238    239            �           2604    33757     archived_appointments archive_id    DEFAULT     �   ALTER TABLE ONLY public.archived_appointments ALTER COLUMN archive_id SET DEFAULT nextval('public.archived_appointments_archive_id_seq'::regclass);
 O   ALTER TABLE public.archived_appointments ALTER COLUMN archive_id DROP DEFAULT;
       public               postgres    false    276    275    276            �           2604    25244    attendance attendance_id    DEFAULT     �   ALTER TABLE ONLY public.attendance ALTER COLUMN attendance_id SET DEFAULT nextval('public.attendance_attendance_id_seq'::regclass);
 G   ALTER TABLE public.attendance ALTER COLUMN attendance_id DROP DEFAULT;
       public               postgres    false    245    244    245            ~           2604    25203    branch_inventory inventory_id    DEFAULT     �   ALTER TABLE ONLY public.branch_inventory ALTER COLUMN inventory_id SET DEFAULT nextval('public.branch_inventory_inventory_id_seq'::regclass);
 L   ALTER TABLE public.branch_inventory ALTER COLUMN inventory_id DROP DEFAULT;
       public               postgres    false    241    240    241            n           2604    25089    branches branch_id    DEFAULT     x   ALTER TABLE ONLY public.branches ALTER COLUMN branch_id SET DEFAULT nextval('public.branches_branch_id_seq'::regclass);
 A   ALTER TABLE public.branches ALTER COLUMN branch_id DROP DEFAULT;
       public               postgres    false    227    226    227            s           2604    25121    categories category_id    DEFAULT     �   ALTER TABLE ONLY public.categories ALTER COLUMN category_id SET DEFAULT nextval('public.categories_category_id_seq'::regclass);
 E   ALTER TABLE public.categories ALTER COLUMN category_id DROP DEFAULT;
       public               postgres    false    231    230    231            �           2604    25421    chart_of_accounts account_id    DEFAULT     �   ALTER TABLE ONLY public.chart_of_accounts ALTER COLUMN account_id SET DEFAULT nextval('public.chart_of_accounts_account_id_seq'::regclass);
 K   ALTER TABLE public.chart_of_accounts ALTER COLUMN account_id DROP DEFAULT;
       public               postgres    false    263    262    263            �           2604    25325 (   customer_communications communication_id    DEFAULT     �   ALTER TABLE ONLY public.customer_communications ALTER COLUMN communication_id SET DEFAULT nextval('public.customer_communications_communication_id_seq'::regclass);
 W   ALTER TABLE public.customer_communications ALTER COLUMN communication_id DROP DEFAULT;
       public               postgres    false    252    253    253            �           2604    25299    customer_feedbacks feedback_id    DEFAULT     �   ALTER TABLE ONLY public.customer_feedbacks ALTER COLUMN feedback_id SET DEFAULT nextval('public.customer_feedbacks_feedback_id_seq'::regclass);
 M   ALTER TABLE public.customer_feedbacks ALTER COLUMN feedback_id DROP DEFAULT;
       public               postgres    false    250    251    251            w           2604    25152    customers customer_id    DEFAULT     ~   ALTER TABLE ONLY public.customers ALTER COLUMN customer_id SET DEFAULT nextval('public.customers_customer_id_seq'::regclass);
 D   ALTER TABLE public.customers ALTER COLUMN customer_id DROP DEFAULT;
       public               postgres    false    235    234    235            �           2604    33794    employee_credentials id    DEFAULT     �   ALTER TABLE ONLY public.employee_credentials ALTER COLUMN id SET DEFAULT nextval('public.employee_credentials_id_seq'::regclass);
 F   ALTER TABLE public.employee_credentials ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    277    278    278            �           2604    34140    employee_schedule id    DEFAULT     |   ALTER TABLE ONLY public.employee_schedule ALTER COLUMN id SET DEFAULT nextval('public.employee_schedule_id_seq'::regclass);
 C   ALTER TABLE public.employee_schedule ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    291    292    292            q           2604    25109    employees employee_id    DEFAULT     ~   ALTER TABLE ONLY public.employees ALTER COLUMN employee_id SET DEFAULT nextval('public.employees_employee_id_seq'::regclass);
 D   ALTER TABLE public.employees ALTER COLUMN employee_id DROP DEFAULT;
       public               postgres    false    228    229    229            �           2604    34109    expense_summary id    DEFAULT     x   ALTER TABLE ONLY public.expense_summary ALTER COLUMN id SET DEFAULT nextval('public.expense_summary_id_seq'::regclass);
 A   ALTER TABLE public.expense_summary ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    287    288    288            �           2604    25438    general_ledger entry_id    DEFAULT     �   ALTER TABLE ONLY public.general_ledger ALTER COLUMN entry_id SET DEFAULT nextval('public.general_ledger_entry_id_seq'::regclass);
 F   ALTER TABLE public.general_ledger ALTER COLUMN entry_id DROP DEFAULT;
       public               postgres    false    264    265    265            �           2604    25274 %   inventory_transactions transaction_id    DEFAULT     �   ALTER TABLE ONLY public.inventory_transactions ALTER COLUMN transaction_id SET DEFAULT nextval('public.inventory_transactions_transaction_id_seq'::regclass);
 T   ALTER TABLE public.inventory_transactions ALTER COLUMN transaction_id DROP DEFAULT;
       public               postgres    false    248    249    249            �           2604    25460    journal_entries journal_id    DEFAULT     �   ALTER TABLE ONLY public.journal_entries ALTER COLUMN journal_id SET DEFAULT nextval('public.journal_entries_journal_id_seq'::regclass);
 I   ALTER TABLE public.journal_entries ALTER COLUMN journal_id DROP DEFAULT;
       public               postgres    false    267    266    267            �           2604    25483    journal_entry_items item_id    DEFAULT     �   ALTER TABLE ONLY public.journal_entry_items ALTER COLUMN item_id SET DEFAULT nextval('public.journal_entry_items_item_id_seq'::regclass);
 J   ALTER TABLE public.journal_entry_items ALTER COLUMN item_id DROP DEFAULT;
       public               postgres    false    269    268    269            �           2604    34123    net_income id    DEFAULT     n   ALTER TABLE ONLY public.net_income ALTER COLUMN id SET DEFAULT nextval('public.net_income_id_seq'::regclass);
 <   ALTER TABLE public.net_income ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    289    290    290            �           2604    25519    notifications notification_id    DEFAULT     �   ALTER TABLE ONLY public.notifications ALTER COLUMN notification_id SET DEFAULT nextval('public.notifications_notification_id_seq'::regclass);
 L   ALTER TABLE public.notifications ALTER COLUMN notification_id DROP DEFAULT;
       public               postgres    false    273    272    273            �           2604    25222    payroll payroll_id    DEFAULT     x   ALTER TABLE ONLY public.payroll ALTER COLUMN payroll_id SET DEFAULT nextval('public.payroll_payroll_id_seq'::regclass);
 A   ALTER TABLE public.payroll ALTER COLUMN payroll_id DROP DEFAULT;
       public               postgres    false    242    243    243            h           2604    24978    permissions permission_id    DEFAULT     �   ALTER TABLE ONLY public.permissions ALTER COLUMN permission_id SET DEFAULT nextval('public.permissions_permission_id_seq'::regclass);
 H   ALTER TABLE public.permissions ALTER COLUMN permission_id DROP DEFAULT;
       public               postgres    false    221    220    221            �           2604    25404    pos_transaction_items item_id    DEFAULT     �   ALTER TABLE ONLY public.pos_transaction_items ALTER COLUMN item_id SET DEFAULT nextval('public.pos_transaction_items_item_id_seq'::regclass);
 L   ALTER TABLE public.pos_transaction_items ALTER COLUMN item_id DROP DEFAULT;
       public               postgres    false    260    261    261            �           2604    25384    pos_transactions transaction_id    DEFAULT     �   ALTER TABLE ONLY public.pos_transactions ALTER COLUMN transaction_id SET DEFAULT nextval('public.pos_transactions_transaction_id_seq'::regclass);
 N   ALTER TABLE public.pos_transactions ALTER COLUMN transaction_id DROP DEFAULT;
       public               postgres    false    259    258    259            t           2604    25135    products product_id    DEFAULT     z   ALTER TABLE ONLY public.products ALTER COLUMN product_id SET DEFAULT nextval('public.products_product_id_seq'::regclass);
 B   ALTER TABLE public.products ALTER COLUMN product_id DROP DEFAULT;
       public               postgres    false    232    233    233            �           2604    34097    recurring_expenses id    DEFAULT     ~   ALTER TABLE ONLY public.recurring_expenses ALTER COLUMN id SET DEFAULT nextval('public.recurring_expenses_id_seq'::regclass);
 D   ALTER TABLE public.recurring_expenses ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    286    285    286            �           2604    33883    restock_requests id    DEFAULT     z   ALTER TABLE ONLY public.restock_requests ALTER COLUMN id SET DEFAULT nextval('public.restock_requests_id_seq'::regclass);
 B   ALTER TABLE public.restock_requests ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    279    280    280            �           2604    34085    revenue_summary id    DEFAULT     x   ALTER TABLE ONLY public.revenue_summary ALTER COLUMN id SET DEFAULT nextval('public.revenue_summary_id_seq'::regclass);
 A   ALTER TABLE public.revenue_summary ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    284    283    284            i           2604    24989 #   role_permissions role_permission_id    DEFAULT     �   ALTER TABLE ONLY public.role_permissions ALTER COLUMN role_permission_id SET DEFAULT nextval('public.role_permissions_role_permission_id_seq'::regclass);
 R   ALTER TABLE public.role_permissions ALTER COLUMN role_permission_id DROP DEFAULT;
       public               postgres    false    222    223    223            g           2604    24967    roles role_id    DEFAULT     n   ALTER TABLE ONLY public.roles ALTER COLUMN role_id SET DEFAULT nextval('public.roles_role_id_seq'::regclass);
 <   ALTER TABLE public.roles ALTER COLUMN role_id DROP DEFAULT;
       public               postgres    false    218    219    219            �           2604    25366    sale_items sale_item_id    DEFAULT     �   ALTER TABLE ONLY public.sale_items ALTER COLUMN sale_item_id SET DEFAULT nextval('public.sale_items_sale_item_id_seq'::regclass);
 F   ALTER TABLE public.sale_items ALTER COLUMN sale_item_id DROP DEFAULT;
       public               postgres    false    257    256    257            �           2604    25345    sales sale_id    DEFAULT     n   ALTER TABLE ONLY public.sales ALTER COLUMN sale_id SET DEFAULT nextval('public.sales_sale_id_seq'::regclass);
 <   ALTER TABLE public.sales ALTER COLUMN sale_id DROP DEFAULT;
       public               postgres    false    255    254    255            x           2604    25167    services service_id    DEFAULT     z   ALTER TABLE ONLY public.services ALTER COLUMN service_id SET DEFAULT nextval('public.services_service_id_seq'::regclass);
 B   ALTER TABLE public.services ALTER COLUMN service_id DROP DEFAULT;
       public               postgres    false    237    236    237            �           2604    25260    shift_schedules schedule_id    DEFAULT     �   ALTER TABLE ONLY public.shift_schedules ALTER COLUMN schedule_id SET DEFAULT nextval('public.shift_schedules_schedule_id_seq'::regclass);
 J   ALTER TABLE public.shift_schedules ALTER COLUMN schedule_id DROP DEFAULT;
       public               postgres    false    247    246    247            �           2604    33984 	   stocks id    DEFAULT     f   ALTER TABLE ONLY public.stocks ALTER COLUMN id SET DEFAULT nextval('public.stocks_id_seq'::regclass);
 8   ALTER TABLE public.stocks ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    282    281    282            �           2604    25504    system_logs log_id    DEFAULT     x   ALTER TABLE ONLY public.system_logs ALTER COLUMN log_id SET DEFAULT nextval('public.system_logs_log_id_seq'::regclass);
 A   ALTER TABLE public.system_logs ALTER COLUMN log_id DROP DEFAULT;
       public               postgres    false    270    271    271            j           2604    25068    users user_id    DEFAULT     n   ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);
 <   ALTER TABLE public.users ALTER COLUMN user_id DROP DEFAULT;
       public               postgres    false    224    225    225                      0    25174    appointments 
   TABLE DATA             COPY public.appointments (appointment_id, customer_id, service_id, employee_id, appointment_date, duration, status, reminder_sent, notes, branch_id, customer_first_name, customer_last_name, customer_phone, customer_email, updated_at, downpayment) FROM stdin;
    public               postgres    false    239   7�      :          0    33754    archived_appointments 
   TABLE DATA           �   COPY public.archived_appointments (archive_id, original_id, customer_data, service_id, employee_id, branch_id, appointment_date, duration, status, notes, archived_at, archive_reason) FROM stdin;
    public               postgres    false    276   ��                0    25241 
   attendance 
   TABLE DATA           Y   COPY public.attendance (attendance_id, employee_id, date, time_in, time_out) FROM stdin;
    public               postgres    false    245   ��                0    25200    branch_inventory 
   TABLE DATA           g   COPY public.branch_inventory (inventory_id, branch_id, product_id, quantity, last_updated) FROM stdin;
    public               postgres    false    241   w�      	          0    25086    branches 
   TABLE DATA           w   COPY public.branches (branch_id, branch_name, location, contact_number, manager_id, is_active, created_at) FROM stdin;
    public               postgres    false    227   \�                0    25118 
   categories 
   TABLE DATA           a   COPY public.categories (category_id, category_name, description, parent_category_id) FROM stdin;
    public               postgres    false    231   Y�      -          0    25418    chart_of_accounts 
   TABLE DATA           �   COPY public.chart_of_accounts (account_id, account_code, account_name, account_type, parent_account_id, is_active, description) FROM stdin;
    public               postgres    false    263   ��      #          0    25322    customer_communications 
   TABLE DATA           �   COPY public.customer_communications (communication_id, customer_id, communication_type, subject, message, created_by, created_at, follow_up_date) FROM stdin;
    public               postgres    false    253   ��      !          0    25296    customer_feedbacks 
   TABLE DATA           �   COPY public.customer_feedbacks (feedback_id, customer_id, appointment_id, rating, comments, feedback_date, responded_by, response, response_date) FROM stdin;
    public               postgres    false    251   ��                0    25149 	   customers 
   TABLE DATA           r   COPY public.customers (customer_id, first_name, last_name, email, phone, password, assigned_staff_id) FROM stdin;
    public               postgres    false    235   ��      <          0    33791    employee_credentials 
   TABLE DATA           _   COPY public.employee_credentials (id, employee_user_id, pin_hash, face_image_path) FROM stdin;
    public               postgres    false    278   X�      J          0    34137    employee_schedule 
   TABLE DATA           m   COPY public.employee_schedule (id, employee_id, day_of_week, start_time, end_time, is_available) FROM stdin;
    public               postgres    false    292   ��      8          0    25532    employee_services 
   TABLE DATA           D   COPY public.employee_services (employee_id, service_id) FROM stdin;
    public               postgres    false    274   �                 0    25106 	   employees 
   TABLE DATA           �   COPY public.employees (employee_id, first_name, last_name, "position", hire_date, base_salary, user_id, branch_id, is_active, birth_date) FROM stdin;
    public               postgres    false    229   N      F          0    34106    expense_summary 
   TABLE DATA           �   COPY public.expense_summary (id, branch_id, year, month, rent, internet, payroll_expense, supplies, water, electricity, total_expense, created_at, updated_at) FROM stdin;
    public               postgres    false    288   �      /          0    25435    general_ledger 
   TABLE DATA           �   COPY public.general_ledger (entry_id, account_id, transaction_date, reference_type, reference_id, debit_amount, credit_amount, balance, description, created_by, created_at) FROM stdin;
    public               postgres    false    265   X                0    25271    inventory_transactions 
   TABLE DATA           �   COPY public.inventory_transactions (transaction_id, product_id, branch_id, transaction_type, quantity, unit_price, reference_id, notes, created_by, created_at) FROM stdin;
    public               postgres    false    249   u      1          0    25457    journal_entries 
   TABLE DATA           �   COPY public.journal_entries (journal_id, entry_date, reference_number, description, total_debit, total_credit, status, posted_by, posted_at, created_by, created_at) FROM stdin;
    public               postgres    false    267   �      3          0    25480    journal_entry_items 
   TABLE DATA           x   COPY public.journal_entry_items (item_id, journal_id, account_id, debit_amount, credit_amount, description) FROM stdin;
    public               postgres    false    269   �      H          0    34120 
   net_income 
   TABLE DATA           X   COPY public.net_income (id, branch_id, year, month, net_income, created_at) FROM stdin;
    public               postgres    false    290   �      7          0    25516    notifications 
   TABLE DATA           �   COPY public.notifications (notification_id, user_id, title, message, is_read, notification_type, reference_id, created_at) FROM stdin;
    public               postgres    false    273                   0    25219    payroll 
   TABLE DATA           �   COPY public.payroll (payroll_id, employee_id, payroll_date, gross_pay, net_pay, working_days, days_worked, deductions, cutoff_start, cutoff_end, status, branch_id) FROM stdin;
    public               postgres    false    243   6                0    24975    permissions 
   TABLE DATA           R   COPY public.permissions (permission_id, permission_name, description) FROM stdin;
    public               postgres    false    221   �      +          0    25401    pos_transaction_items 
   TABLE DATA           w   COPY public.pos_transaction_items (item_id, transaction_id, product_id, quantity, unit_price, total_price) FROM stdin;
    public               postgres    false    261   �      )          0    25381    pos_transactions 
   TABLE DATA           �   COPY public.pos_transactions (transaction_id, branch_id, cashier_id, transaction_date, total_amount, amount_tendered, change_amount, payment_method, receipt_number, customer_id, gcash_reference, appointment_id) FROM stdin;
    public               postgres    false    259   �                0    25132    products 
   TABLE DATA           �   COPY public.products (product_id, product_name, description, category_id, reorder_level, is_active, branch_id, updated_at, created_at, price) FROM stdin;
    public               postgres    false    233   @	      D          0    34094    recurring_expenses 
   TABLE DATA           W   COPY public.recurring_expenses (id, branch_id, rent, internet, updated_at) FROM stdin;
    public               postgres    false    286   �      >          0    33880    restock_requests 
   TABLE DATA           �   COPY public.restock_requests (id, product_id, branch_id, current_quantity, requested_quantity, status, requested_by, requested_at, processed_by, processed_at, notes) FROM stdin;
    public               postgres    false    280         B          0    34082    revenue_summary 
   TABLE DATA           K   COPY public.revenue_summary (id, branch_id, date, total_sales) FROM stdin;
    public               postgres    false    284   s                0    24986    role_permissions 
   TABLE DATA           V   COPY public.role_permissions (role_permission_id, role_id, permission_id) FROM stdin;
    public               postgres    false    223   �                0    24964    roles 
   TABLE DATA           @   COPY public.roles (role_id, role_name, description) FROM stdin;
    public               postgres    false    219   �      '          0    25363 
   sale_items 
   TABLE DATA              COPY public.sale_items (sale_item_id, sale_id, product_id, quantity, unit_price, discount_percentage, total_price) FROM stdin;
    public               postgres    false    257   r      %          0    25342    sales 
   TABLE DATA           �   COPY public.sales (sale_id, customer_id, sale_date, total_amount, payment_method, payment_status, discount_amount, tax_amount, created_by) FROM stdin;
    public               postgres    false    255   �                0    25164    services 
   TABLE DATA           e   COPY public.services (service_id, service_name, description, duration, price, is_active) FROM stdin;
    public               postgres    false    237   �                0    25257    shift_schedules 
   TABLE DATA           �   COPY public.shift_schedules (schedule_id, employee_id, shift_name, start_time, end_time, effective_date, end_date, is_recurring, recurring_pattern, created_at) FROM stdin;
    public               postgres    false    247   %      @          0    33981    stocks 
   TABLE DATA           S   COPY public.stocks (id, product_id, branch_id, quantity, last_updated) FROM stdin;
    public               postgres    false    282   B      5          0    25501    system_logs 
   TABLE DATA           z   COPY public.system_logs (log_id, user_id, action, entity_type, entity_id, ip_address, user_agent, created_at) FROM stdin;
    public               postgres    false    271   .                0    25065    users 
   TABLE DATA           �   COPY public.users (user_id, username, password_hash, email, first_name, last_name, role_id, is_active, last_login, created_at, updated_at, branch_id) FROM stdin;
    public               postgres    false    225   K      w           0    0    appointments_appointment_id_seq    SEQUENCE SET     N   SELECT pg_catalog.setval('public.appointments_appointment_id_seq', 49, true);
          public               postgres    false    238            x           0    0 $   archived_appointments_archive_id_seq    SEQUENCE SET     S   SELECT pg_catalog.setval('public.archived_appointments_archive_id_seq', 48, true);
          public               postgres    false    275            y           0    0    attendance_attendance_id_seq    SEQUENCE SET     K   SELECT pg_catalog.setval('public.attendance_attendance_id_seq', 41, true);
          public               postgres    false    244            z           0    0 !   branch_inventory_inventory_id_seq    SEQUENCE SET     P   SELECT pg_catalog.setval('public.branch_inventory_inventory_id_seq', 34, true);
          public               postgres    false    240            {           0    0    branches_branch_id_seq    SEQUENCE SET     D   SELECT pg_catalog.setval('public.branches_branch_id_seq', 6, true);
          public               postgres    false    226            |           0    0    categories_category_id_seq    SEQUENCE SET     I   SELECT pg_catalog.setval('public.categories_category_id_seq', 36, true);
          public               postgres    false    230            }           0    0     chart_of_accounts_account_id_seq    SEQUENCE SET     O   SELECT pg_catalog.setval('public.chart_of_accounts_account_id_seq', 1, false);
          public               postgres    false    262            ~           0    0 ,   customer_communications_communication_id_seq    SEQUENCE SET     [   SELECT pg_catalog.setval('public.customer_communications_communication_id_seq', 1, false);
          public               postgres    false    252                       0    0 "   customer_feedbacks_feedback_id_seq    SEQUENCE SET     P   SELECT pg_catalog.setval('public.customer_feedbacks_feedback_id_seq', 1, true);
          public               postgres    false    250            �           0    0    customers_customer_id_seq    SEQUENCE SET     G   SELECT pg_catalog.setval('public.customers_customer_id_seq', 8, true);
          public               postgres    false    234            �           0    0    employee_credentials_id_seq    SEQUENCE SET     J   SELECT pg_catalog.setval('public.employee_credentials_id_seq', 18, true);
          public               postgres    false    277            �           0    0    employee_schedule_id_seq    SEQUENCE SET     G   SELECT pg_catalog.setval('public.employee_schedule_id_seq', 58, true);
          public               postgres    false    291            �           0    0    employees_employee_id_seq    SEQUENCE SET     H   SELECT pg_catalog.setval('public.employees_employee_id_seq', 22, true);
          public               postgres    false    228            �           0    0    expense_summary_id_seq    SEQUENCE SET     D   SELECT pg_catalog.setval('public.expense_summary_id_seq', 8, true);
          public               postgres    false    287            �           0    0    general_ledger_entry_id_seq    SEQUENCE SET     J   SELECT pg_catalog.setval('public.general_ledger_entry_id_seq', 1, false);
          public               postgres    false    264            �           0    0 )   inventory_transactions_transaction_id_seq    SEQUENCE SET     X   SELECT pg_catalog.setval('public.inventory_transactions_transaction_id_seq', 29, true);
          public               postgres    false    248            �           0    0    journal_entries_journal_id_seq    SEQUENCE SET     M   SELECT pg_catalog.setval('public.journal_entries_journal_id_seq', 1, false);
          public               postgres    false    266            �           0    0    journal_entry_items_item_id_seq    SEQUENCE SET     N   SELECT pg_catalog.setval('public.journal_entry_items_item_id_seq', 1, false);
          public               postgres    false    268            �           0    0    net_income_id_seq    SEQUENCE SET     ?   SELECT pg_catalog.setval('public.net_income_id_seq', 1, true);
          public               postgres    false    289            �           0    0 !   notifications_notification_id_seq    SEQUENCE SET     P   SELECT pg_catalog.setval('public.notifications_notification_id_seq', 1, false);
          public               postgres    false    272            �           0    0    payroll_payroll_id_seq    SEQUENCE SET     E   SELECT pg_catalog.setval('public.payroll_payroll_id_seq', 14, true);
          public               postgres    false    242            �           0    0    permissions_permission_id_seq    SEQUENCE SET     L   SELECT pg_catalog.setval('public.permissions_permission_id_seq', 25, true);
          public               postgres    false    220            �           0    0 !   pos_transaction_items_item_id_seq    SEQUENCE SET     P   SELECT pg_catalog.setval('public.pos_transaction_items_item_id_seq', 31, true);
          public               postgres    false    260            �           0    0 #   pos_transactions_transaction_id_seq    SEQUENCE SET     R   SELECT pg_catalog.setval('public.pos_transactions_transaction_id_seq', 39, true);
          public               postgres    false    258            �           0    0    products_product_id_seq    SEQUENCE SET     G   SELECT pg_catalog.setval('public.products_product_id_seq', 104, true);
          public               postgres    false    232            �           0    0    recurring_expenses_id_seq    SEQUENCE SET     G   SELECT pg_catalog.setval('public.recurring_expenses_id_seq', 4, true);
          public               postgres    false    285            �           0    0    restock_requests_id_seq    SEQUENCE SET     F   SELECT pg_catalog.setval('public.restock_requests_id_seq', 10, true);
          public               postgres    false    279            �           0    0    revenue_summary_id_seq    SEQUENCE SET     D   SELECT pg_catalog.setval('public.revenue_summary_id_seq', 2, true);
          public               postgres    false    283            �           0    0 '   role_permissions_role_permission_id_seq    SEQUENCE SET     V   SELECT pg_catalog.setval('public.role_permissions_role_permission_id_seq', 65, true);
          public               postgres    false    222            �           0    0    roles_role_id_seq    SEQUENCE SET     ?   SELECT pg_catalog.setval('public.roles_role_id_seq', 4, true);
          public               postgres    false    218            �           0    0    sale_items_sale_item_id_seq    SEQUENCE SET     J   SELECT pg_catalog.setval('public.sale_items_sale_item_id_seq', 1, false);
          public               postgres    false    256            �           0    0    sales_sale_id_seq    SEQUENCE SET     @   SELECT pg_catalog.setval('public.sales_sale_id_seq', 1, false);
          public               postgres    false    254            �           0    0    services_service_id_seq    SEQUENCE SET     E   SELECT pg_catalog.setval('public.services_service_id_seq', 5, true);
          public               postgres    false    236            �           0    0    shift_schedules_schedule_id_seq    SEQUENCE SET     N   SELECT pg_catalog.setval('public.shift_schedules_schedule_id_seq', 1, false);
          public               postgres    false    246            �           0    0    stocks_id_seq    SEQUENCE SET     <   SELECT pg_catalog.setval('public.stocks_id_seq', 39, true);
          public               postgres    false    281            �           0    0    system_logs_log_id_seq    SEQUENCE SET     E   SELECT pg_catalog.setval('public.system_logs_log_id_seq', 1, false);
          public               postgres    false    270            �           0    0    users_user_id_seq    SEQUENCE SET     ?   SELECT pg_catalog.setval('public.users_user_id_seq', 8, true);
          public               postgres    false    224            �           2606    25183    appointments appointments_pkey 
   CONSTRAINT     h   ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (appointment_id);
 H   ALTER TABLE ONLY public.appointments DROP CONSTRAINT appointments_pkey;
       public                 postgres    false    239                       2606    33763 0   archived_appointments archived_appointments_pkey 
   CONSTRAINT     v   ALTER TABLE ONLY public.archived_appointments
    ADD CONSTRAINT archived_appointments_pkey PRIMARY KEY (archive_id);
 Z   ALTER TABLE ONLY public.archived_appointments DROP CONSTRAINT archived_appointments_pkey;
       public                 postgres    false    276            �           2606    25250 *   attendance attendance_employee_id_date_key 
   CONSTRAINT     r   ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_employee_id_date_key UNIQUE (employee_id, date);
 T   ALTER TABLE ONLY public.attendance DROP CONSTRAINT attendance_employee_id_date_key;
       public                 postgres    false    245    245            �           2606    25248    attendance attendance_pkey 
   CONSTRAINT     c   ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_pkey PRIMARY KEY (attendance_id);
 D   ALTER TABLE ONLY public.attendance DROP CONSTRAINT attendance_pkey;
       public                 postgres    false    245            �           2606    25207 &   branch_inventory branch_inventory_pkey 
   CONSTRAINT     n   ALTER TABLE ONLY public.branch_inventory
    ADD CONSTRAINT branch_inventory_pkey PRIMARY KEY (inventory_id);
 P   ALTER TABLE ONLY public.branch_inventory DROP CONSTRAINT branch_inventory_pkey;
       public                 postgres    false    241            �           2606    25093    branches branches_pkey 
   CONSTRAINT     [   ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_pkey PRIMARY KEY (branch_id);
 @   ALTER TABLE ONLY public.branches DROP CONSTRAINT branches_pkey;
       public                 postgres    false    227            �           2606    25125    categories categories_pkey 
   CONSTRAINT     a   ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (category_id);
 D   ALTER TABLE ONLY public.categories DROP CONSTRAINT categories_pkey;
       public                 postgres    false    231                       2606    25428 4   chart_of_accounts chart_of_accounts_account_code_key 
   CONSTRAINT     w   ALTER TABLE ONLY public.chart_of_accounts
    ADD CONSTRAINT chart_of_accounts_account_code_key UNIQUE (account_code);
 ^   ALTER TABLE ONLY public.chart_of_accounts DROP CONSTRAINT chart_of_accounts_account_code_key;
       public                 postgres    false    263                       2606    25426 (   chart_of_accounts chart_of_accounts_pkey 
   CONSTRAINT     n   ALTER TABLE ONLY public.chart_of_accounts
    ADD CONSTRAINT chart_of_accounts_pkey PRIMARY KEY (account_id);
 R   ALTER TABLE ONLY public.chart_of_accounts DROP CONSTRAINT chart_of_accounts_pkey;
       public                 postgres    false    263            �           2606    25330 4   customer_communications customer_communications_pkey 
   CONSTRAINT     �   ALTER TABLE ONLY public.customer_communications
    ADD CONSTRAINT customer_communications_pkey PRIMARY KEY (communication_id);
 ^   ALTER TABLE ONLY public.customer_communications DROP CONSTRAINT customer_communications_pkey;
       public                 postgres    false    253            �           2606    25305 *   customer_feedbacks customer_feedbacks_pkey 
   CONSTRAINT     q   ALTER TABLE ONLY public.customer_feedbacks
    ADD CONSTRAINT customer_feedbacks_pkey PRIMARY KEY (feedback_id);
 T   ALTER TABLE ONLY public.customer_feedbacks DROP CONSTRAINT customer_feedbacks_pkey;
       public                 postgres    false    251            �           2606    25157    customers customers_pkey 
   CONSTRAINT     _   ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (customer_id);
 B   ALTER TABLE ONLY public.customers DROP CONSTRAINT customers_pkey;
       public                 postgres    false    235                       2606    33798 .   employee_credentials employee_credentials_pkey 
   CONSTRAINT     l   ALTER TABLE ONLY public.employee_credentials
    ADD CONSTRAINT employee_credentials_pkey PRIMARY KEY (id);
 X   ALTER TABLE ONLY public.employee_credentials DROP CONSTRAINT employee_credentials_pkey;
       public                 postgres    false    278                       2606    33805 5   employee_credentials employee_credentials_user_id_key 
   CONSTRAINT     |   ALTER TABLE ONLY public.employee_credentials
    ADD CONSTRAINT employee_credentials_user_id_key UNIQUE (employee_user_id);
 _   ALTER TABLE ONLY public.employee_credentials DROP CONSTRAINT employee_credentials_user_id_key;
       public                 postgres    false    278            )           2606    34143 (   employee_schedule employee_schedule_pkey 
   CONSTRAINT     f   ALTER TABLE ONLY public.employee_schedule
    ADD CONSTRAINT employee_schedule_pkey PRIMARY KEY (id);
 R   ALTER TABLE ONLY public.employee_schedule DROP CONSTRAINT employee_schedule_pkey;
       public                 postgres    false    292                       2606    25536 (   employee_services employee_services_pkey 
   CONSTRAINT     {   ALTER TABLE ONLY public.employee_services
    ADD CONSTRAINT employee_services_pkey PRIMARY KEY (employee_id, service_id);
 R   ALTER TABLE ONLY public.employee_services DROP CONSTRAINT employee_services_pkey;
       public                 postgres    false    274    274            �           2606    25111    employees employees_pkey 
   CONSTRAINT     _   ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (employee_id);
 B   ALTER TABLE ONLY public.employees DROP CONSTRAINT employees_pkey;
       public                 postgres    false    229            �           2606    33789     employees employees_user_id_pkey 
   CONSTRAINT     ^   ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_user_id_pkey UNIQUE (user_id);
 J   ALTER TABLE ONLY public.employees DROP CONSTRAINT employees_user_id_pkey;
       public                 postgres    false    229            %           2606    34113 $   expense_summary expense_summary_pkey 
   CONSTRAINT     b   ALTER TABLE ONLY public.expense_summary
    ADD CONSTRAINT expense_summary_pkey PRIMARY KEY (id);
 N   ALTER TABLE ONLY public.expense_summary DROP CONSTRAINT expense_summary_pkey;
       public                 postgres    false    288                       2606    25445 "   general_ledger general_ledger_pkey 
   CONSTRAINT     f   ALTER TABLE ONLY public.general_ledger
    ADD CONSTRAINT general_ledger_pkey PRIMARY KEY (entry_id);
 L   ALTER TABLE ONLY public.general_ledger DROP CONSTRAINT general_ledger_pkey;
       public                 postgres    false    265            �           2606    25279 2   inventory_transactions inventory_transactions_pkey 
   CONSTRAINT     |   ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_pkey PRIMARY KEY (transaction_id);
 \   ALTER TABLE ONLY public.inventory_transactions DROP CONSTRAINT inventory_transactions_pkey;
       public                 postgres    false    249            	           2606    25466 $   journal_entries journal_entries_pkey 
   CONSTRAINT     j   ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT journal_entries_pkey PRIMARY KEY (journal_id);
 N   ALTER TABLE ONLY public.journal_entries DROP CONSTRAINT journal_entries_pkey;
       public                 postgres    false    267                       2606    25468 4   journal_entries journal_entries_reference_number_key 
   CONSTRAINT     {   ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT journal_entries_reference_number_key UNIQUE (reference_number);
 ^   ALTER TABLE ONLY public.journal_entries DROP CONSTRAINT journal_entries_reference_number_key;
       public                 postgres    false    267                       2606    25489 ,   journal_entry_items journal_entry_items_pkey 
   CONSTRAINT     o   ALTER TABLE ONLY public.journal_entry_items
    ADD CONSTRAINT journal_entry_items_pkey PRIMARY KEY (item_id);
 V   ALTER TABLE ONLY public.journal_entry_items DROP CONSTRAINT journal_entry_items_pkey;
       public                 postgres    false    269            '           2606    34125    net_income net_income_pkey 
   CONSTRAINT     X   ALTER TABLE ONLY public.net_income
    ADD CONSTRAINT net_income_pkey PRIMARY KEY (id);
 D   ALTER TABLE ONLY public.net_income DROP CONSTRAINT net_income_pkey;
       public                 postgres    false    290                       2606    25525     notifications notifications_pkey 
   CONSTRAINT     k   ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (notification_id);
 J   ALTER TABLE ONLY public.notifications DROP CONSTRAINT notifications_pkey;
       public                 postgres    false    273            �           2606    25229    payroll payroll_pkey 
   CONSTRAINT     Z   ALTER TABLE ONLY public.payroll
    ADD CONSTRAINT payroll_pkey PRIMARY KEY (payroll_id);
 >   ALTER TABLE ONLY public.payroll DROP CONSTRAINT payroll_pkey;
       public                 postgres    false    243            �           2606    24984 +   permissions permissions_permission_name_key 
   CONSTRAINT     q   ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_permission_name_key UNIQUE (permission_name);
 U   ALTER TABLE ONLY public.permissions DROP CONSTRAINT permissions_permission_name_key;
       public                 postgres    false    221            �           2606    24982    permissions permissions_pkey 
   CONSTRAINT     e   ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (permission_id);
 F   ALTER TABLE ONLY public.permissions DROP CONSTRAINT permissions_pkey;
       public                 postgres    false    221                       2606    25406 0   pos_transaction_items pos_transaction_items_pkey 
   CONSTRAINT     s   ALTER TABLE ONLY public.pos_transaction_items
    ADD CONSTRAINT pos_transaction_items_pkey PRIMARY KEY (item_id);
 Z   ALTER TABLE ONLY public.pos_transaction_items DROP CONSTRAINT pos_transaction_items_pkey;
       public                 postgres    false    261            �           2606    25387 &   pos_transactions pos_transactions_pkey 
   CONSTRAINT     p   ALTER TABLE ONLY public.pos_transactions
    ADD CONSTRAINT pos_transactions_pkey PRIMARY KEY (transaction_id);
 P   ALTER TABLE ONLY public.pos_transactions DROP CONSTRAINT pos_transactions_pkey;
       public                 postgres    false    259            �           2606    25389 4   pos_transactions pos_transactions_receipt_number_key 
   CONSTRAINT     y   ALTER TABLE ONLY public.pos_transactions
    ADD CONSTRAINT pos_transactions_receipt_number_key UNIQUE (receipt_number);
 ^   ALTER TABLE ONLY public.pos_transactions DROP CONSTRAINT pos_transactions_receipt_number_key;
       public                 postgres    false    259            �           2606    25140    products products_pkey 
   CONSTRAINT     \   ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (product_id);
 @   ALTER TABLE ONLY public.products DROP CONSTRAINT products_pkey;
       public                 postgres    false    233            #           2606    34099 *   recurring_expenses recurring_expenses_pkey 
   CONSTRAINT     h   ALTER TABLE ONLY public.recurring_expenses
    ADD CONSTRAINT recurring_expenses_pkey PRIMARY KEY (id);
 T   ALTER TABLE ONLY public.recurring_expenses DROP CONSTRAINT recurring_expenses_pkey;
       public                 postgres    false    286                       2606    33889 &   restock_requests restock_requests_pkey 
   CONSTRAINT     d   ALTER TABLE ONLY public.restock_requests
    ADD CONSTRAINT restock_requests_pkey PRIMARY KEY (id);
 P   ALTER TABLE ONLY public.restock_requests DROP CONSTRAINT restock_requests_pkey;
       public                 postgres    false    280            !           2606    34087 $   revenue_summary revenue_summary_pkey 
   CONSTRAINT     b   ALTER TABLE ONLY public.revenue_summary
    ADD CONSTRAINT revenue_summary_pkey PRIMARY KEY (id);
 N   ALTER TABLE ONLY public.revenue_summary DROP CONSTRAINT revenue_summary_pkey;
       public                 postgres    false    284            �           2606    24991 &   role_permissions role_permissions_pkey 
   CONSTRAINT     t   ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_permission_id);
 P   ALTER TABLE ONLY public.role_permissions DROP CONSTRAINT role_permissions_pkey;
       public                 postgres    false    223            �           2606    24993 ;   role_permissions role_permissions_role_id_permission_id_key 
   CONSTRAINT     �   ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_permission_id_key UNIQUE (role_id, permission_id);
 e   ALTER TABLE ONLY public.role_permissions DROP CONSTRAINT role_permissions_role_id_permission_id_key;
       public                 postgres    false    223    223            �           2606    24971    roles roles_pkey 
   CONSTRAINT     S   ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (role_id);
 :   ALTER TABLE ONLY public.roles DROP CONSTRAINT roles_pkey;
       public                 postgres    false    219            �           2606    24973    roles roles_role_name_key 
   CONSTRAINT     Y   ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_role_name_key UNIQUE (role_name);
 C   ALTER TABLE ONLY public.roles DROP CONSTRAINT roles_role_name_key;
       public                 postgres    false    219            �           2606    25369    sale_items sale_items_pkey 
   CONSTRAINT     b   ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_pkey PRIMARY KEY (sale_item_id);
 D   ALTER TABLE ONLY public.sale_items DROP CONSTRAINT sale_items_pkey;
       public                 postgres    false    257            �           2606    25351    sales sales_pkey 
   CONSTRAINT     S   ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_pkey PRIMARY KEY (sale_id);
 :   ALTER TABLE ONLY public.sales DROP CONSTRAINT sales_pkey;
       public                 postgres    false    255            �           2606    25172    services services_pkey 
   CONSTRAINT     \   ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (service_id);
 @   ALTER TABLE ONLY public.services DROP CONSTRAINT services_pkey;
       public                 postgres    false    237            �           2606    25264 $   shift_schedules shift_schedules_pkey 
   CONSTRAINT     k   ALTER TABLE ONLY public.shift_schedules
    ADD CONSTRAINT shift_schedules_pkey PRIMARY KEY (schedule_id);
 N   ALTER TABLE ONLY public.shift_schedules DROP CONSTRAINT shift_schedules_pkey;
       public                 postgres    false    247                       2606    33989    stocks stocks_pkey 
   CONSTRAINT     P   ALTER TABLE ONLY public.stocks
    ADD CONSTRAINT stocks_pkey PRIMARY KEY (id);
 <   ALTER TABLE ONLY public.stocks DROP CONSTRAINT stocks_pkey;
       public                 postgres    false    282                       2606    25509    system_logs system_logs_pkey 
   CONSTRAINT     ^   ALTER TABLE ONLY public.system_logs
    ADD CONSTRAINT system_logs_pkey PRIMARY KEY (log_id);
 F   ALTER TABLE ONLY public.system_logs DROP CONSTRAINT system_logs_pkey;
       public                 postgres    false    271                       2606    33991    stocks unique_branch_product 
   CONSTRAINT     h   ALTER TABLE ONLY public.stocks
    ADD CONSTRAINT unique_branch_product UNIQUE (branch_id, product_id);
 F   ALTER TABLE ONLY public.stocks DROP CONSTRAINT unique_branch_product;
       public                 postgres    false    282    282            �           2606    34075    payroll unique_cutoff_employee 
   CONSTRAINT     z   ALTER TABLE ONLY public.payroll
    ADD CONSTRAINT unique_cutoff_employee UNIQUE (employee_id, cutoff_start, cutoff_end);
 H   ALTER TABLE ONLY public.payroll DROP CONSTRAINT unique_cutoff_employee;
       public                 postgres    false    243    243    243            �           2606    34049    employees unique_employee_id 
   CONSTRAINT     ^   ALTER TABLE ONLY public.employees
    ADD CONSTRAINT unique_employee_id UNIQUE (employee_id);
 F   ALTER TABLE ONLY public.employees DROP CONSTRAINT unique_employee_id;
       public                 postgres    false    229            �           2606    25079    users users_email_key 
   CONSTRAINT     Q   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);
 ?   ALTER TABLE ONLY public.users DROP CONSTRAINT users_email_key;
       public                 postgres    false    225            �           2606    25075    users users_pkey 
   CONSTRAINT     S   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);
 :   ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
       public                 postgres    false    225            �           2606    33787    users users_user_id_key 
   CONSTRAINT     U   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_user_id_key UNIQUE (user_id);
 A   ALTER TABLE ONLY public.users DROP CONSTRAINT users_user_id_key;
       public                 postgres    false    225            �           2606    25077    users users_username_key 
   CONSTRAINT     W   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);
 B   ALTER TABLE ONLY public.users DROP CONSTRAINT users_username_key;
       public                 postgres    false    225            �           1259    33814    idx_categories_parent_id    INDEX     ]   CREATE INDEX idx_categories_parent_id ON public.categories USING btree (parent_category_id);
 ,   DROP INDEX public.idx_categories_parent_id;
       public                 postgres    false    231            l           2620    33780 (   appointments archive_appointment_trigger    TRIGGER     �   CREATE TRIGGER archive_appointment_trigger BEFORE DELETE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.archive_appointment();
 A   DROP TRIGGER archive_appointment_trigger ON public.appointments;
       public               postgres    false    239    298            m           2620    25562 #   pos_transactions set_receipt_number    TRIGGER     �   CREATE TRIGGER set_receipt_number BEFORE INSERT ON public.pos_transactions FOR EACH ROW EXECUTE FUNCTION public.generate_receipt_number();
 <   DROP TRIGGER set_receipt_number ON public.pos_transactions;
       public               postgres    false    294    259            k           2620    33813 "   products update_products_timestamp    TRIGGER     �   CREATE TRIGGER update_products_timestamp BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
 ;   DROP TRIGGER update_products_timestamp ON public.products;
       public               postgres    false    233    293            n           2620    34003     stocks update_stock_last_updated    TRIGGER     �   CREATE TRIGGER update_stock_last_updated BEFORE UPDATE ON public.stocks FOR EACH ROW EXECUTE FUNCTION public.update_last_updated_column();
 9   DROP TRIGGER update_stock_last_updated ON public.stocks;
       public               postgres    false    282    295            5           2606    25547 (   appointments appointments_branch_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id);
 R   ALTER TABLE ONLY public.appointments DROP CONSTRAINT appointments_branch_id_fkey;
       public               postgres    false    239    227    5076            6           2606    25184 *   appointments appointments_customer_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id);
 T   ALTER TABLE ONLY public.appointments DROP CONSTRAINT appointments_customer_id_fkey;
       public               postgres    false    235    239    5089            7           2606    25194 *   appointments appointments_employee_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id);
 T   ALTER TABLE ONLY public.appointments DROP CONSTRAINT appointments_employee_id_fkey;
       public               postgres    false    5078    229    239            8           2606    25189 )   appointments appointments_service_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(service_id);
 S   ALTER TABLE ONLY public.appointments DROP CONSTRAINT appointments_service_id_fkey;
       public               postgres    false    5091    239    237            \           2606    33774 :   archived_appointments archived_appointments_branch_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.archived_appointments
    ADD CONSTRAINT archived_appointments_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id);
 d   ALTER TABLE ONLY public.archived_appointments DROP CONSTRAINT archived_appointments_branch_id_fkey;
       public               postgres    false    276    5076    227            ]           2606    33769 <   archived_appointments archived_appointments_employee_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.archived_appointments
    ADD CONSTRAINT archived_appointments_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id);
 f   ALTER TABLE ONLY public.archived_appointments DROP CONSTRAINT archived_appointments_employee_id_fkey;
       public               postgres    false    276    229    5078            ^           2606    33764 ;   archived_appointments archived_appointments_service_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.archived_appointments
    ADD CONSTRAINT archived_appointments_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(service_id);
 e   ALTER TABLE ONLY public.archived_appointments DROP CONSTRAINT archived_appointments_service_id_fkey;
       public               postgres    false    276    237    5091            =           2606    25251 &   attendance attendance_employee_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id);
 P   ALTER TABLE ONLY public.attendance DROP CONSTRAINT attendance_employee_id_fkey;
       public               postgres    false    245    5078    229            f           2606    34088    revenue_summary branch_fk    FK CONSTRAINT     �   ALTER TABLE ONLY public.revenue_summary
    ADD CONSTRAINT branch_fk FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id);
 C   ALTER TABLE ONLY public.revenue_summary DROP CONSTRAINT branch_fk;
       public               postgres    false    5076    284    227            g           2606    34100    recurring_expenses branch_fk    FK CONSTRAINT     �   ALTER TABLE ONLY public.recurring_expenses
    ADD CONSTRAINT branch_fk FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id);
 F   ALTER TABLE ONLY public.recurring_expenses DROP CONSTRAINT branch_fk;
       public               postgres    false    5076    227    286            i           2606    34126    net_income branch_id    FK CONSTRAINT        ALTER TABLE ONLY public.net_income
    ADD CONSTRAINT branch_id FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id);
 >   ALTER TABLE ONLY public.net_income DROP CONSTRAINT branch_id;
       public               postgres    false    5076    227    290            9           2606    25208 0   branch_inventory branch_inventory_branch_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.branch_inventory
    ADD CONSTRAINT branch_inventory_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id);
 Z   ALTER TABLE ONLY public.branch_inventory DROP CONSTRAINT branch_inventory_branch_id_fkey;
       public               postgres    false    227    241    5076            :           2606    25213 1   branch_inventory branch_inventory_product_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.branch_inventory
    ADD CONSTRAINT branch_inventory_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id);
 [   ALTER TABLE ONLY public.branch_inventory DROP CONSTRAINT branch_inventory_product_id_fkey;
       public               postgres    false    5087    241    233            h           2606    34114    expense_summary branches    FK CONSTRAINT     �   ALTER TABLE ONLY public.expense_summary
    ADD CONSTRAINT branches FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id);
 B   ALTER TABLE ONLY public.expense_summary DROP CONSTRAINT branches;
       public               postgres    false    227    5076    288            .           2606    25094 !   branches branches_manager_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.users(user_id);
 K   ALTER TABLE ONLY public.branches DROP CONSTRAINT branches_manager_id_fkey;
       public               postgres    false    5070    225    227            1           2606    25126 -   categories categories_parent_category_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_parent_category_id_fkey FOREIGN KEY (parent_category_id) REFERENCES public.categories(category_id);
 W   ALTER TABLE ONLY public.categories DROP CONSTRAINT categories_parent_category_id_fkey;
       public               postgres    false    231    5084    231            Q           2606    25429 :   chart_of_accounts chart_of_accounts_parent_account_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.chart_of_accounts
    ADD CONSTRAINT chart_of_accounts_parent_account_id_fkey FOREIGN KEY (parent_account_id) REFERENCES public.chart_of_accounts(account_id);
 d   ALTER TABLE ONLY public.chart_of_accounts DROP CONSTRAINT chart_of_accounts_parent_account_id_fkey;
       public               postgres    false    263    5125    263            E           2606    25336 ?   customer_communications customer_communications_created_by_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.customer_communications
    ADD CONSTRAINT customer_communications_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id);
 i   ALTER TABLE ONLY public.customer_communications DROP CONSTRAINT customer_communications_created_by_fkey;
       public               postgres    false    253    5070    225            F           2606    25331 @   customer_communications customer_communications_customer_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.customer_communications
    ADD CONSTRAINT customer_communications_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id);
 j   ALTER TABLE ONLY public.customer_communications DROP CONSTRAINT customer_communications_customer_id_fkey;
       public               postgres    false    253    5089    235            B           2606    25311 9   customer_feedbacks customer_feedbacks_appointment_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.customer_feedbacks
    ADD CONSTRAINT customer_feedbacks_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(appointment_id);
 c   ALTER TABLE ONLY public.customer_feedbacks DROP CONSTRAINT customer_feedbacks_appointment_id_fkey;
       public               postgres    false    239    251    5093            C           2606    25306 6   customer_feedbacks customer_feedbacks_customer_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.customer_feedbacks
    ADD CONSTRAINT customer_feedbacks_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id);
 `   ALTER TABLE ONLY public.customer_feedbacks DROP CONSTRAINT customer_feedbacks_customer_id_fkey;
       public               postgres    false    235    5089    251            D           2606    25316 7   customer_feedbacks customer_feedbacks_responded_by_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.customer_feedbacks
    ADD CONSTRAINT customer_feedbacks_responded_by_fkey FOREIGN KEY (responded_by) REFERENCES public.users(user_id);
 a   ALTER TABLE ONLY public.customer_feedbacks DROP CONSTRAINT customer_feedbacks_responded_by_fkey;
       public               postgres    false    5070    225    251            4           2606    34154 *   customers customers_assigned_staff_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_assigned_staff_id_fkey FOREIGN KEY (assigned_staff_id) REFERENCES public.users(user_id) NOT VALID;
 T   ALTER TABLE ONLY public.customers DROP CONSTRAINT customers_assigned_staff_id_fkey;
       public               postgres    false    5070    235    225            _           2606    34131 #   employee_credentials employee_id_fk    FK CONSTRAINT     �   ALTER TABLE ONLY public.employee_credentials
    ADD CONSTRAINT employee_id_fk FOREIGN KEY (employee_user_id) REFERENCES public.employees(employee_id) NOT VALID;
 M   ALTER TABLE ONLY public.employee_credentials DROP CONSTRAINT employee_id_fk;
       public               postgres    false    278    5078    229            j           2606    34144     employee_schedule employee_id_fk    FK CONSTRAINT     �   ALTER TABLE ONLY public.employee_schedule
    ADD CONSTRAINT employee_id_fk FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id);
 J   ALTER TABLE ONLY public.employee_schedule DROP CONSTRAINT employee_id_fk;
       public               postgres    false    229    292    5078            Z           2606    25537 4   employee_services employee_services_employee_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.employee_services
    ADD CONSTRAINT employee_services_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id);
 ^   ALTER TABLE ONLY public.employee_services DROP CONSTRAINT employee_services_employee_id_fkey;
       public               postgres    false    274    5078    229            [           2606    25542 3   employee_services employee_services_service_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.employee_services
    ADD CONSTRAINT employee_services_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(service_id);
 ]   ALTER TABLE ONLY public.employee_services DROP CONSTRAINT employee_services_service_id_fkey;
       public               postgres    false    237    274    5091            /           2606    25552 "   employees employees_branch_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id);
 L   ALTER TABLE ONLY public.employees DROP CONSTRAINT employees_branch_id_fkey;
       public               postgres    false    227    5076    229            0           2606    33806    employees employees_user_id_fk    FK CONSTRAINT     �   ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_user_id_fk FOREIGN KEY (user_id) REFERENCES public.users(user_id) NOT VALID;
 H   ALTER TABLE ONLY public.employees DROP CONSTRAINT employees_user_id_fk;
       public               postgres    false    229    5070    225            2           2606    33781    products fk_products_branches    FK CONSTRAINT     �   ALTER TABLE ONLY public.products
    ADD CONSTRAINT fk_products_branches FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id);
 G   ALTER TABLE ONLY public.products DROP CONSTRAINT fk_products_branches;
       public               postgres    false    233    5076    227            R           2606    25446 -   general_ledger general_ledger_account_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.general_ledger
    ADD CONSTRAINT general_ledger_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.chart_of_accounts(account_id);
 W   ALTER TABLE ONLY public.general_ledger DROP CONSTRAINT general_ledger_account_id_fkey;
       public               postgres    false    263    5125    265            S           2606    25451 -   general_ledger general_ledger_created_by_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.general_ledger
    ADD CONSTRAINT general_ledger_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id);
 W   ALTER TABLE ONLY public.general_ledger DROP CONSTRAINT general_ledger_created_by_fkey;
       public               postgres    false    5070    225    265            ?           2606    25285 <   inventory_transactions inventory_transactions_branch_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id);
 f   ALTER TABLE ONLY public.inventory_transactions DROP CONSTRAINT inventory_transactions_branch_id_fkey;
       public               postgres    false    5076    227    249            @           2606    25290 =   inventory_transactions inventory_transactions_created_by_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id);
 g   ALTER TABLE ONLY public.inventory_transactions DROP CONSTRAINT inventory_transactions_created_by_fkey;
       public               postgres    false    225    5070    249            A           2606    25280 =   inventory_transactions inventory_transactions_product_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id);
 g   ALTER TABLE ONLY public.inventory_transactions DROP CONSTRAINT inventory_transactions_product_id_fkey;
       public               postgres    false    5087    249    233            T           2606    25474 /   journal_entries journal_entries_created_by_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT journal_entries_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id);
 Y   ALTER TABLE ONLY public.journal_entries DROP CONSTRAINT journal_entries_created_by_fkey;
       public               postgres    false    225    267    5070            U           2606    25469 .   journal_entries journal_entries_posted_by_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT journal_entries_posted_by_fkey FOREIGN KEY (posted_by) REFERENCES public.users(user_id);
 X   ALTER TABLE ONLY public.journal_entries DROP CONSTRAINT journal_entries_posted_by_fkey;
       public               postgres    false    225    267    5070            V           2606    25495 7   journal_entry_items journal_entry_items_account_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.journal_entry_items
    ADD CONSTRAINT journal_entry_items_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.chart_of_accounts(account_id);
 a   ALTER TABLE ONLY public.journal_entry_items DROP CONSTRAINT journal_entry_items_account_id_fkey;
       public               postgres    false    269    5125    263            W           2606    25490 7   journal_entry_items journal_entry_items_journal_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.journal_entry_items
    ADD CONSTRAINT journal_entry_items_journal_id_fkey FOREIGN KEY (journal_id) REFERENCES public.journal_entries(journal_id);
 a   ALTER TABLE ONLY public.journal_entry_items DROP CONSTRAINT journal_entry_items_journal_id_fkey;
       public               postgres    false    5129    269    267            Y           2606    25526 (   notifications notifications_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
 R   ALTER TABLE ONLY public.notifications DROP CONSTRAINT notifications_user_id_fkey;
       public               postgres    false    225    5070    273            ;           2606    34076    payroll payroll_branch_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.payroll
    ADD CONSTRAINT payroll_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) NOT VALID;
 H   ALTER TABLE ONLY public.payroll DROP CONSTRAINT payroll_branch_id_fkey;
       public               postgres    false    227    5076    243            <           2606    25230     payroll payroll_employee_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.payroll
    ADD CONSTRAINT payroll_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id);
 J   ALTER TABLE ONLY public.payroll DROP CONSTRAINT payroll_employee_id_fkey;
       public               postgres    false    243    229    5078            O           2606    25412 ;   pos_transaction_items pos_transaction_items_product_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.pos_transaction_items
    ADD CONSTRAINT pos_transaction_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id);
 e   ALTER TABLE ONLY public.pos_transaction_items DROP CONSTRAINT pos_transaction_items_product_id_fkey;
       public               postgres    false    233    261    5087            P           2606    25407 ?   pos_transaction_items pos_transaction_items_transaction_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.pos_transaction_items
    ADD CONSTRAINT pos_transaction_items_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.pos_transactions(transaction_id);
 i   ALTER TABLE ONLY public.pos_transaction_items DROP CONSTRAINT pos_transaction_items_transaction_id_fkey;
       public               postgres    false    259    5117    261            K           2606    34149 5   pos_transactions pos_transactions_appointment_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.pos_transactions
    ADD CONSTRAINT pos_transactions_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(appointment_id);
 _   ALTER TABLE ONLY public.pos_transactions DROP CONSTRAINT pos_transactions_appointment_id_fkey;
       public               postgres    false    239    5093    259            L           2606    25390 0   pos_transactions pos_transactions_branch_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.pos_transactions
    ADD CONSTRAINT pos_transactions_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id);
 Z   ALTER TABLE ONLY public.pos_transactions DROP CONSTRAINT pos_transactions_branch_id_fkey;
       public               postgres    false    259    5076    227            M           2606    25395 1   pos_transactions pos_transactions_cashier_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.pos_transactions
    ADD CONSTRAINT pos_transactions_cashier_id_fkey FOREIGN KEY (cashier_id) REFERENCES public.users(user_id);
 [   ALTER TABLE ONLY public.pos_transactions DROP CONSTRAINT pos_transactions_cashier_id_fkey;
       public               postgres    false    225    259    5070            N           2606    25563 2   pos_transactions pos_transactions_customer_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.pos_transactions
    ADD CONSTRAINT pos_transactions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id);
 \   ALTER TABLE ONLY public.pos_transactions DROP CONSTRAINT pos_transactions_customer_id_fkey;
       public               postgres    false    259    235    5089            3           2606    25143 "   products products_category_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(category_id);
 L   ALTER TABLE ONLY public.products DROP CONSTRAINT products_category_id_fkey;
       public               postgres    false    231    233    5084            `           2606    33895 0   restock_requests restock_requests_branch_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.restock_requests
    ADD CONSTRAINT restock_requests_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id);
 Z   ALTER TABLE ONLY public.restock_requests DROP CONSTRAINT restock_requests_branch_id_fkey;
       public               postgres    false    5076    280    227            a           2606    33905 3   restock_requests restock_requests_processed_by_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.restock_requests
    ADD CONSTRAINT restock_requests_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES public.users(user_id);
 ]   ALTER TABLE ONLY public.restock_requests DROP CONSTRAINT restock_requests_processed_by_fkey;
       public               postgres    false    225    5070    280            b           2606    33890 1   restock_requests restock_requests_product_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.restock_requests
    ADD CONSTRAINT restock_requests_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id);
 [   ALTER TABLE ONLY public.restock_requests DROP CONSTRAINT restock_requests_product_id_fkey;
       public               postgres    false    5087    233    280            c           2606    33900 3   restock_requests restock_requests_requested_by_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.restock_requests
    ADD CONSTRAINT restock_requests_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.users(user_id);
 ]   ALTER TABLE ONLY public.restock_requests DROP CONSTRAINT restock_requests_requested_by_fkey;
       public               postgres    false    5070    280    225            *           2606    24999 4   role_permissions role_permissions_permission_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(permission_id);
 ^   ALTER TABLE ONLY public.role_permissions DROP CONSTRAINT role_permissions_permission_id_fkey;
       public               postgres    false    223    5062    221            +           2606    24994 .   role_permissions role_permissions_role_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(role_id);
 X   ALTER TABLE ONLY public.role_permissions DROP CONSTRAINT role_permissions_role_id_fkey;
       public               postgres    false    223    5056    219            I           2606    25375 %   sale_items sale_items_product_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id);
 O   ALTER TABLE ONLY public.sale_items DROP CONSTRAINT sale_items_product_id_fkey;
       public               postgres    false    257    233    5087            J           2606    25370 "   sale_items sale_items_sale_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(sale_id);
 L   ALTER TABLE ONLY public.sale_items DROP CONSTRAINT sale_items_sale_id_fkey;
       public               postgres    false    255    5113    257            G           2606    25357    sales sales_created_by_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id);
 E   ALTER TABLE ONLY public.sales DROP CONSTRAINT sales_created_by_fkey;
       public               postgres    false    225    255    5070            H           2606    25352    sales sales_customer_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id);
 F   ALTER TABLE ONLY public.sales DROP CONSTRAINT sales_customer_id_fkey;
       public               postgres    false    255    5089    235            >           2606    25265 0   shift_schedules shift_schedules_employee_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.shift_schedules
    ADD CONSTRAINT shift_schedules_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id);
 Z   ALTER TABLE ONLY public.shift_schedules DROP CONSTRAINT shift_schedules_employee_id_fkey;
       public               postgres    false    229    5078    247            d           2606    33997    stocks stocks_branch_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.stocks
    ADD CONSTRAINT stocks_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE CASCADE;
 F   ALTER TABLE ONLY public.stocks DROP CONSTRAINT stocks_branch_id_fkey;
       public               postgres    false    5076    227    282            e           2606    33992    stocks stocks_product_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.stocks
    ADD CONSTRAINT stocks_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id) ON DELETE CASCADE;
 G   ALTER TABLE ONLY public.stocks DROP CONSTRAINT stocks_product_id_fkey;
       public               postgres    false    233    282    5087            X           2606    25510 $   system_logs system_logs_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.system_logs
    ADD CONSTRAINT system_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
 N   ALTER TABLE ONLY public.system_logs DROP CONSTRAINT system_logs_user_id_fkey;
       public               postgres    false    225    5070    271            ,           2606    25099    users users_branch_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id);
 D   ALTER TABLE ONLY public.users DROP CONSTRAINT users_branch_id_fkey;
       public               postgres    false    227    225    5076            -           2606    25080    users users_role_id_fkey    FK CONSTRAINT     |   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(role_id);
 B   ALTER TABLE ONLY public.users DROP CONSTRAINT users_role_id_fkey;
       public               postgres    false    225    219    5056               x  x���Mn�0�דS����?+DUUb����b�iM\��=}� 
	��M��}~o�f�@���	��D	����v��o��ۺM�i�#��\i��m��d��0[��K�~Um��$�DLUL�1;-�Ļ^R��?��R)��P���>�HH��ۍ���Dw~N�[i��b7����5��q��%�{�Q@r�����]|�&��M�e>����WWBPØ�����.%����QD�R7ӭ��.��D5�{��pv�_�ꡈ[S�b���93W4[ozq��h%gH�V��M��~O!�5���鴮�'��G�ғ�E�����*t0���}�άs>ץ����0��E�˙&Q���x�      :      x������ � �         �   x���A�0���| p������i��$�JViX�0T���v��4T�qQq��lP+��B�A])ƅ� z(v��E�B���+NZ�.
9!���*,*<�\�7E���B�-dnq"T�1�������˻ ��le-         �   x���A�0��+��$��[���X�m/X�r����l:u������w�w��?���4~��_}��rw�̮sj��5#�(�Q-����@�M���"f�	�� �����I"��?�Il���j��$��$V(�'�&����{�Y,@���GiC�E�!��!����*Ee�ӆ�o<�b�K�;J�z��`j#�W��aN��      	   �   x���Mk�0��+t�N�e{Ysk2c������8�����%����@!�G�5۵����buf�����)��Ce�4uWy
P�>8O�6�S�#��

��K��P���RC�6�&Q�s4i��l��a��Uꇺ[l��c5Z�T�}��?�b���߸��x럘B��a�-f�M���^�	f�L�Y�l�/�Xˑ�R����� 3��:.���VVY�)S��/_Ei�         5  x�uUMw�6<C�����>K��c�����E~�%Z�$>S�BRI�__�����=�.9����[���K���l3����:��q�Q�L�Q��4*(k�/i�0�	��!+�8V[ǁZ���R/����b\r0gU�5����)�/��*�|O��}
U-�(��2<T#�Jj�/T�b���Q��3�����j�K���S�>�n��
ø1�x��oq[�c��4�����^�I�ɕFԳmf������]½�^v)��s�V��g�\�?���m+�%�� .N��Z��A|�>�1N�hz^jkD� N���T�Fka�*�@�EV��_��.I�PP1t�A�N�����F�x��84��\���n��I�w�t��>p�W=2k��ʬ8�
�oTxBz��n>dؑ+��s��7�=��Nu=��o��|�ʬ���jtr��U������|�a��pK/ew��9�5|�e|>_���a3J���6{��a����?KO�X�[�wYY,���M�S4��1��~B�YY�W쨉n�RE�6�5�Z��'n�YV��n�;�IG��0y
�)(�>���^n^��yV.v���t��Y+�@/����e�|5b��	��6�s�8\d��[���h��vn�o�Ot�<δK��=��A���8��-�����k.��*��^���E�W�͜�O7� ��*�A;��Ԙ��u�Wٮ !Ґ�`s�Xa��;�܄�\�����?ax��Ey�I������䌢&!�� ��AF%�O�{1$�hNv.��kފ�����rR��ODrS��ӱ([-_�$M��?�,�F[9      -      x������ � �      #      x������ � �      !      x������ � �         S  x�U��r�0�u|��`W���E+"�0M�J������͝{VߜC��l��
`�UVp��G���?ř�iyc��T�US�'C���y���r\�y���r�^�/i�[c��~c�:��H�i��l�o�`���"A,����0UU&=�[S��<�"cg,o���UϠX؜I�H�n��[-?����s���0a��RV�%����B�$I{b�0w���:��0�E��`g3�	_�<�R�;�@Jj$�&���S�[q`���VeR��,�NU(�%��q۶��턱��c1��=)꦳9�p��C��Ԏ�[pc'd�|p{8~�r��      <   s   x���
�  �k}���C+�7�C�.��aF�ӽ�΁�(���@�؎�6�3�Mis�W�Gq���{��_4Xt��I:��v��)�ٯav/�e�R`�$ߎ�ZN)��� (      J     x�}�Kn�0еr���9v��uO���$�%UL�y�C��������.�����	HHIHJ)�GI����![ʋd:����8�� ���jJ�wZV��iMBn����⇦�1���y�t�p��A�"i�CMw�k�Vg�E�Y�iz�4�3�6��E��L��6Mwϗ6d9��å�Ԣ�Bִ.h�y��aϢ��մ�a���/����Y]����s���A�3봑���� ۦ������ؕ'��|}<����      8   R   x�%���0�a�J�������(�>����^�����	�d���ֺs����MaS��X0�aH�X���F
��K��X�         ~  x�uT]S�0|>�
��I��m�hI�a:����$���6L��{r@q�ɓ�����;gޢ�œ��p�6�mہJr�p��RB�S!��$t �RpI��%p��z��~k����LH�e2��5!�R,�/�b�p�xoZ�D�Oݶ�.J.��q�s)X_�i����:\�e�E΅�M�)����ͣ����"�Me�;۸��
�~��v��w.
V��������������H��=I�2�	����9���U$݈,�%�`%|oi���u�y�]HGڍ%�zA�1�v��l�6�z�|��:��D�I	?����S�z��zɮ}\U�����h�W�N��Bt>*7�U�K�nȵ�M�V�}"�Fh1��2��m�k��5�?:M�D��
�A�����5̖��=lF<z��<�^3�e����n�u�>#m"����� �-aA���	v�=�G���ʄ}L�����������ʌ�4<ɒI�9B^7�Gl	q�8���٠�bJ¢o�	;�4�N�E�}�$���C�\5[Z�s��"�|ru��~����/���KȰ�n
Y�dw�u�[�r�[i�t?D8>9S�~��oo股��'�~�!,"	�q*�%)��������`Y      F   l   x�u���0��]���9سt�9j9�%*B|�� #Wab����d"!	�=�MlF�s�c�1�f���u��n��/�~��G���{�ZG1І�X�~�J�f���)/      /      x������ � �           x���=N1��9�^`�<�$�AC����H-h i�ѧ�// 1��}��������ݛ��o�=��ֻ���Fh����uh׎�4��N���f !���Q ��D��P�]�@	�22�_F}s<pE�ҭ��"��:�pGɅv���r���!�r7.�6���@�*�`�,�u"@����J��`�i��c$�����퓪�1������|I���NO�vk�G�3Ǔ��B���q�<
��tc5��;h��WWi����8A�ZJ����      1      x������ � �      3      x������ � �      H   :   x�Ȼ	  �:��^/_�Y�E�ꔔ�4|������|g�	�*�|��/n	�      7      x������ � �         �   x���A
!E�߻��'��]��������B���� Q�BE�&~ID��Q"H��k]i�Rf���`�������ጴ�ux��
�u��̰����쬰�����g���>����Aԓ!�s����]�������9{�?�[!< =x}�         �  x�m�ώ� ���)x�j�������R���*E�M�H1�Ѽ}M�M*q
���ئ����-|3��u�Ih��U���=v4�O�c^j�s�Ag��	����b�3��@d�5�V��l�gu�1�v2��cuX}����j���~�?�*���}�c�4�.ܩ��f�H&Ė�+�x�K�#�+������'��ȷR�ҩSU�u�c�m�v@to9竪���Թ����E���[�z���	p��)�.e�p�>��$�P��f�e�.�N�^�|���Xw�7FUҼ���{�I�w�Ƅi��:W ;��I�ڎ��^ E�����Y�6Kz�$�1�|�+�R�=QZ؍�%V��̍��NR�9��-��UA+E�wn�u��c�50J�UX�Yz0'7A����缔�ϝ�e����\=��p���v�����@$Y�ߣ�!.�|�N�d��R���V      +      x������ � �      )   a   x��̡�0P�~?�������	A���O����=uh3KNܫ{U���Y��b~��ٷ�uZ��C�	+���F�jU�����k�����         p  x��W�r�6}���4 x�[b�u&����%/	I� m�_�o�uB��2g<#���gϞ��%���Jr'�-^�f����Sox-��"��(E1���(&�*�WY�<OH�)��t�rLȊ�+�/
w+7�ϒ��p��-����>W�ZY�;ѠϺ�.�:�� ��9lD���4�PiЉ4*�v		I��,�D��A�j�t'#�3TB����)����l��D�#��J��G��x�7�`�����n���(����3�˦݉�K����G;':+|���Gox˷ � ꉾ9Mҷcg��k�z�v�T�խѭv`xk���A���EN��<��bw-@��Z��g�;�E���X�z���#&1z	i�/<Ak��ŭ0-�|�s�����ߍ4���=��߰�w:�@��s�-�h��m�u(�FC

_��1�#b�=��p��`@�MQf�`3�nd?M���#�	���G����{��\��.<* �l��e������D  x� s����$���T�.``�^�<�;��7����91�e����P��j5��}��i ���A�NX�3��N��$UJI1[���O��/�<n    =��#7m���Ur��US�v�*ҒP��9��3'��d�:ʪ4E��bE�%MY���_���I�8�S*t��z6L���=�	�Ю��/tO�eU�jNi�o3����� �����-����wbp����|"UQ��qD!A~�G����^u:�o��(�7�A(�!�)$i^͐�|���ca� ��3���J�]�'����"���'7O~�!�&����Q��,L�=���Xt�G�۠�F�A�<�=�S�G�r�Ph���������}oB"��YB��ͣ���jߘq˃�C��!D�[-��؟f��	�YI�l>�}!�q[�����K�ȷ��k���6�����d�ĻFzYB_P����d�͒"��xDYep���׏۹n{%� ���N���/;'`Oi��W[ZAhka����a��f߻���� �:�A�8�D�/�,²{�{i���^D�e&��!]]�*�V�dak`l��f2!>%�|�c/S���a:z�0[����&���I1�'&���a����0������Կ�_N.d9�1����߁.%��Z�������f�H�'iy�%0M�'�$�л���L��	n�ע�5�\��O0,�ȋ�'���H�b�^Òl!b�x��!Mq�E��Q%��]r�~��B|�bٲ��0�v�b6;gdo]�������ٰ���D[��Ω�jK�s������v�zu�]e/^�+L��"Ų���$��myvv�?�S      D   O   x�m��	�0����Y�!�� ���@ɫ��Hd�l$T/�m!��	�~�c���Sup�7ŕ��l^u*vv��z��      >   D  x�u�INC1D��)�����!8A6�aC����%K^T�S��RE��<�������^��bϾ׺(` (�Q[��Ŷ0��\��u�S��	s�ɰ ���L��+��ɴ2gl��u�8�}?DڰN���郅DE�H<)C0�����R:��u�8���zi���i1X��m�wr�j��؀Q��f+g��q�K��܃���V�f�G��HO�0�Hh��M���Z��b+P�i�up��s��7�EY��քum������{�u���R����L,��3ٌ(�3�E2�1
�����ṧ�<�n��7��      B   0   x�Uȱ  �9��*�h%~��;��h#��K{�p�t��{eJ�-���y         �   x���!�(�����a�u�,�.."��T&JYhec���<�ʋ�|����$h��	Z��a�q@�x@�xA����F���/�"�E!z��Ј#�
���e#i��f"�,�_�H�T!-S��M�:U(�tui6��BhT
�*��{ZS�k^�3z�r�r�%r����U�j�����E���G��g�������0<�Q3?m�Ժ����.�B         �   x�=OAj1<ۯ�
i�$��K���^T�6x%#i��hq�M��ь�g���4-��cm��f�K�}C�
.Z�V4˯i���V��ފ�	p�<s����΃bM���0�ı'hE��N��aSi-��S����3���DO�]�}A�aSl#9�+�D���2G�@t�8�N|}T��>�?�k��%�|�`�      '      x������ � �      %      x������ � �         i   x�3��H�,J.-���46�445�30�,�2K(8�����,8---!rƜ��y�ɥE� S ��2�HM�˘p�@eL!��&�祀$-8���1z\\\ ��!W            x������ � �      @   �  x���Kn$1C��Sd��ߒ�2�?��v�I�P�������M�R�"���`�ӭ�+�R��f��Fg�2۠4V�� �u͠�y*�/��P�2�Fc{�XӹKU�lp��r�|��������N�J�\�p���x���؋e�x��SG'����h���8�^At�ZC6w�.��L�`dS���ػ����f�6dJu��:6�ډ��"�#0�
�u� ����3��Z�xO��-qE� �uj�]��5*| ���}����7�5�7g��Kx�B� w�mS�S�D��M��Ci�t��X�5���P�~'|��^��|���;u:Sb�����ŧ�>�Z��Qk�Պw�&������j������I���Cob=�7PP���tc������S� D4{���B!���~`l���9R�8�i Q�����4���bJ����\P����:����

e������/���:      5      x������ � �         �  x���Ks�@F�ͯ��m�~ ���1��C!Znx��S2�b̌.f6V��|���S�.^��9���QG��6��͢7��k/ʏ�Ҥ�Nc�T�������B����&�C�}!����ʔ��M�3���`k����#�=4�h@�	��-,�W^D��{�wŶ�T�Mt^�oɾʜ�ۄ����O�ᩲ��Cs`���
W�)�4��Q������}�xAP4y����k���nOa�z'��@ɦ�4�Z|O�QK�E�u=��JR��i!C�]qn7��-�>WT,`ey����$��l���O95|*�w}�x�9���`�:^�7S�o����݈�����w
���>]	�d�ͽZpd�,c���X*ቻ���b�񪄓�D���G��g�w:g�*{W�'�yqzv]}����צ�#XPy@��������P�����     