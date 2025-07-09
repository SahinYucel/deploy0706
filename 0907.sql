-- phpMyAdmin SQL Dump
-- version 5.2.1deb3
-- https://www.phpmyadmin.net/
--
-- Anamakine: localhost:3306
-- Üretim Zamanı: 09 Tem 2025, 19:18:31
-- Sunucu sürümü: 8.0.42-0ubuntu0.24.04.1
-- PHP Sürümü: 8.3.6

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Veritabanı: `tour_program2`
--

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `agencyguide`
--

CREATE TABLE `agencyguide` (
  `id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `surname` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `is_login` tinyint(1) NOT NULL,
  `guide_group` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nickname` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `languages` json DEFAULT NULL,
  `other_languages` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `phone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sifre` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `company_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `entitlement` decimal(10,2) DEFAULT '0.00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `agencyprovider`
--

CREATE TABLE `agencyprovider` (
  `id` int NOT NULL,
  `companyRef` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `company_name` varchar(50) NOT NULL,
  `operator_type` varchar(10) NOT NULL,
  `phone_number` varchar(100) NOT NULL,
  `password` int DEFAULT NULL,
  `status` int NOT NULL,
  `company_id` int NOT NULL,
  `entry_time` time DEFAULT NULL,
  `exit_time` time DEFAULT '20:00:00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `agencyrolemembers`
--

CREATE TABLE `agencyrolemembers` (
  `id` int NOT NULL,
  `username` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `position` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `company_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `agencyrolemembers`
--

INSERT INTO `agencyrolemembers` (`id`, `username`, `position`, `password`, `company_id`, `created_at`) VALUES
(155, 'admin', 'admin', '$2b$10$VTLq7knAEWsCt1YGTQ/uVODVLG.KpC4SmUUe7vGGyhrnQ.31/N/Cq', 135, '2025-06-19 19:27:55');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `areaslist`
--

CREATE TABLE `areaslist` (
  `id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `region_id` int NOT NULL,
  `company_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `companyusers`
--

CREATE TABLE `companyusers` (
  `id` int NOT NULL,
  `company_name` varchar(255) NOT NULL,
  `position` varchar(50) NOT NULL,
  `ref_code` varchar(50) NOT NULL,
  `company_user` varchar(100) NOT NULL,
  `company_pass` varchar(100) NOT NULL,
  `duration_use` varchar(20) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `verification` varchar(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Tablo döküm verisi `companyusers`
--

INSERT INTO `companyusers` (`id`, `company_name`, `position`, `ref_code`, `company_user`, `company_pass`, `duration_use`, `created_at`, `verification`) VALUES
(135, 'maxtoria', 'Agency', 'MAX3111', 'maxtoria', '$2b$10$ltAjc8OFHJcZyjCxaqTg2eM2gXt7et66dUM3H9wPKYfQAoPbF4hHK', '5', '2025-05-24 20:40:18', '3IHT0O');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `create_areaslist`
--

CREATE TABLE `create_areaslist` (
  `id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `company_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `currency_rates`
--

CREATE TABLE `currency_rates` (
  `id` int NOT NULL,
  `company_id` int NOT NULL,
  `currency_code` varchar(3) NOT NULL,
  `currency_name` varchar(50) NOT NULL,
  `buying_rate` decimal(10,4) NOT NULL,
  `symbol` varchar(5) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Tablo döküm verisi `currency_rates`
--

INSERT INTO `currency_rates` (`id`, `company_id`, `currency_code`, `currency_name`, `buying_rate`, `symbol`, `created_at`) VALUES
(217, 135, 'EUR', 'Euro', 46.8836, '€', '2025-07-08 19:04:27'),
(218, 135, 'USD', 'ABD Doları', 39.9332, '$', '2025-07-08 19:04:27'),
(219, 135, 'GBP', 'İngiliz Sterlini', 54.2344, '£', '2025-07-08 19:04:27'),
(220, 135, 'TRY', 'Türk Lirası', 1.0000, '₺', '2025-07-08 19:04:27');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `guide_collections`
--

CREATE TABLE `guide_collections` (
  `id` int NOT NULL,
  `transaction_no` varchar(6) NOT NULL,
  `guide_name` varchar(255) NOT NULL,
  `collection_date` datetime NOT NULL,
  `description` text,
  `guide_earning` decimal(10,2) DEFAULT '0.00',
  `reservation_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `currency_rates` varchar(100) DEFAULT NULL,
  `rest_amount` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `guide_regions`
--

CREATE TABLE `guide_regions` (
  `id` int NOT NULL,
  `guide_id` int NOT NULL,
  `company_id` int NOT NULL,
  `region_name` varchar(255) NOT NULL,
  `CREATED_AT` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `main_tours`
--

CREATE TABLE `main_tours` (
  `id` int NOT NULL,
  `company_ref` int NOT NULL,
  `tour_name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `provider_collection`
--

CREATE TABLE `provider_collection` (
  `id` int NOT NULL,
  `ticket_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `collection_date` date NOT NULL,
  `provider_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `provider_ref` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transaction_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tour_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tour_group_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `hotel_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `room_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `guide_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `adult_count` int NOT NULL DEFAULT '0',
  `child_count` int NOT NULL DEFAULT '0',
  `free_count` int NOT NULL DEFAULT '0',
  `adult_price` decimal(10,2) NOT NULL,
  `half_price` decimal(10,2) NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `rest_amount` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `comment` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `ticket_number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `regionslist`
--

CREATE TABLE `regionslist` (
  `id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `company_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `reservations`
--

CREATE TABLE `reservations` (
  `id` int NOT NULL,
  `customer_name` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `room_number` varchar(50) NOT NULL,
  `hotel_name` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `ticket_count` int NOT NULL DEFAULT '0',
  `guide_name` varchar(100) DEFAULT NULL,
  `main_comment` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `commission_rate` decimal(5,2) DEFAULT '0.00',
  `status` tinyint NOT NULL DEFAULT '1',
  `is_cost_guide` tinyint NOT NULL DEFAULT '0',
  `currency_rates` varchar(255) DEFAULT NULL,
  `company_id` int DEFAULT NULL,
  `reservation_guide_color` tinyint DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Tetikleyiciler `reservations`
--
DELIMITER $$

CREATE TRIGGER update_reservation_approve
AFTER UPDATE ON reservations
FOR EACH ROW
BEGIN
    UPDATE reservation_approve 
    SET customer_name = NEW.customer_name,
        phone = NEW.phone
    WHERE reservation_id = NEW.id;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `reservation_approve`
--

CREATE TABLE `reservation_approve` (
  `id` int NOT NULL,
  `reservation_id` int NOT NULL,
  `ticket_no` int NOT NULL,
  `adult_count` int DEFAULT NULL,
  `child_count` int DEFAULT NULL,
  `free_count` int DEFAULT NULL,
  `hotel_name` varchar(255) DEFAULT NULL,
  `room_number` varchar(50) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `time` time DEFAULT NULL,
  `customer_name` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `description` text,
  `rest_amount` varchar(100) DEFAULT NULL,
  `currency` varchar(10) DEFAULT NULL,
  `guide_name` varchar(255) DEFAULT NULL,
  `guide_ref` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `ticket_options` text,
  `guide_phone` varchar(20) DEFAULT NULL,
  `tour_name` varchar(255) DEFAULT NULL,
  `tour_group_name` varchar(255) DEFAULT NULL,
  `provider_ref` varchar(255) DEFAULT NULL,
  `status` tinyint DEFAULT '0',
  `show_status` tinyint DEFAULT '1',
  `guide_status` tinyint DEFAULT '1',
  `provider_status` tinyint DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `reservation_payments`
--

CREATE TABLE `reservation_payments` (
  `id` int NOT NULL,
  `reservation_id` int NOT NULL,
  `payment_type` varchar(20) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(10) NOT NULL,
  `rest_amount` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `reservation_tickets`
--

CREATE TABLE `reservation_tickets` (
  `id` int NOT NULL,
  `reservation_id` int NOT NULL,
  `tour_name` varchar(255) NOT NULL,
  `tour_group_name` varchar(255) NOT NULL,
  `adult_count` int NOT NULL DEFAULT '0',
  `child_count` int NOT NULL DEFAULT '0',
  `free_count` int NOT NULL DEFAULT '0',
  `currency` varchar(10) DEFAULT 'TL',
  `date` date DEFAULT NULL,
  `comment` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `regions` varchar(50) NOT NULL,
  `guide_ref` varchar(50) DEFAULT NULL,
  `guide_name` varchar(50) NOT NULL,
  `provider_name` varchar(255) DEFAULT NULL,
  `provider_ref` varchar(255) DEFAULT NULL,
  `time` varchar(10) DEFAULT NULL,
  `adult_price` decimal(10,2) DEFAULT NULL,
  `half_price` decimal(10,2) DEFAULT NULL,
  `cancellation_reason` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `status` tinyint NOT NULL DEFAULT '1',
  `ticket_number` varchar(6) DEFAULT NULL,
  `total_cost` decimal(10,2) DEFAULT NULL,
  `guide_adult_price` decimal(10,2) DEFAULT NULL,
  `guide_child_price` decimal(10,2) DEFAULT NULL,
  `is_cost_provider` tinyint(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `role_permissions`
--

CREATE TABLE `role_permissions` (
  `id` int NOT NULL,
  `company_id` int NOT NULL,
  `role_name` varchar(50) NOT NULL,
  `page_id` varchar(50) NOT NULL,
  `has_permission` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `safe`
--

CREATE TABLE `safe` (
  `id` int NOT NULL,
  `company_id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('cash','card') COLLATE utf8mb4_unicode_ci NOT NULL,
  `pos_commission_rate` decimal(5,2) DEFAULT NULL,
  `balance` decimal(10,2) DEFAULT '0.00',
  `negativebalance` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `safe_records`
--

CREATE TABLE `safe_records` (
  `id` int NOT NULL,
  `transaction_no` varchar(50) NOT NULL,
  `account_name` varchar(50) NOT NULL,
  `created_at` datetime NOT NULL,
  `description` text,
  `payment_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `payment_method` enum('cash','card') DEFAULT NULL,
  `currency` varchar(10) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `sub_tours`
--

CREATE TABLE `sub_tours` (
  `id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `tour_id` int NOT NULL,
  `company_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `ticket_options`
--

CREATE TABLE `ticket_options` (
  `id` int NOT NULL,
  `ticket_id` int NOT NULL,
  `option_name` varchar(255) NOT NULL,
  `price` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `ticket_rest_amount`
--

CREATE TABLE `ticket_rest_amount` (
  `id` int NOT NULL,
  `ticket_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(10) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `tourlist`
--

CREATE TABLE `tourlist` (
  `id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `company_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `tours`
--

CREATE TABLE `tours` (
  `id` int NOT NULL,
  `company_ref` int NOT NULL,
  `tour_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `operator` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `operator_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `adult_price` decimal(10,2) DEFAULT '0.00',
  `guide_adult_price` decimal(10,2) DEFAULT '0.00',
  `child_price` decimal(10,2) DEFAULT '0.00',
  `guide_child_price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `priority` int DEFAULT '3',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `currency` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'EUR',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `main_tour_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tetikleyiciler `tours`
--
DELIMITER $$

CREATE TRIGGER delete_main_tour_after_tour_delete
AFTER DELETE ON tours
FOR EACH ROW
BEGIN
    DELETE FROM main_tours
    WHERE id = OLD.main_tour_id
    AND NOT EXISTS (
        SELECT 1 FROM tours WHERE main_tour_id = OLD.main_tour_id
    );
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `tour_days`
--

CREATE TABLE `tour_days` (
  `id` int NOT NULL,
  `tour_id` int NOT NULL,
  `day_number` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `tour_options`
--

CREATE TABLE `tour_options` (
  `id` int NOT NULL,
  `tour_id` int NOT NULL,
  `option_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(10,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `tour_pickup_times`
--

CREATE TABLE `tour_pickup_times` (
  `id` int NOT NULL,
  `tour_id` int NOT NULL,
  `hour` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `minute` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `region` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `area` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `period_active` tinyint(1) DEFAULT '0',
  `period` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `start_pickup_date` date DEFAULT NULL,
  `end_pickup_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `tour_regions`
--

CREATE TABLE `tour_regions` (
  `tour_id` int NOT NULL,
  `company_id` int NOT NULL,
  `region_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Tablo döküm verisi `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password`) VALUES
(41, 'admin', 'sahinyucel@yandex.com', '$2b$10$Hf.bpixjGlV4Tyoguy.Cuum/Wh56gsWa7ChYiQhYweYS4crnEGSY6');

--
-- Dökümü yapılmış tablolar için indeksler
--

--
-- Tablo için indeksler `agencyguide`
--
ALTER TABLE `agencyguide`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_company` (`company_id`);

--
-- Tablo için indeksler `agencyprovider`
--
ALTER TABLE `agencyprovider`
  ADD PRIMARY KEY (`id`),
  ADD KEY `company_id` (`company_id`),
  ADD KEY `idx_companyRef` (`companyRef`) USING BTREE;

--
-- Tablo için indeksler `agencyrolemembers`
--
ALTER TABLE `agencyrolemembers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `company_id` (`company_id`);

--
-- Tablo için indeksler `areaslist`
--
ALTER TABLE `areaslist`
  ADD PRIMARY KEY (`id`),
  ADD KEY `region_id` (`region_id`),
  ADD KEY `company_id` (`company_id`);

--
-- Tablo için indeksler `companyusers`
--
ALTER TABLE `companyusers`
  ADD PRIMARY KEY (`id`);

--
-- Tablo için indeksler `create_areaslist`
--
ALTER TABLE `create_areaslist`
  ADD PRIMARY KEY (`id`),
  ADD KEY `create_areaslist_1` (`company_id`);

--
-- Tablo için indeksler `currency_rates`
--
ALTER TABLE `currency_rates`
  ADD PRIMARY KEY (`id`);

--
-- Tablo için indeksler `guide_collections`
--
ALTER TABLE `guide_collections`
  ADD PRIMARY KEY (`id`),
  ADD KEY `guide_collection` (`reservation_id`);

--
-- Tablo için indeksler `guide_regions`
--
ALTER TABLE `guide_regions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `guide_id` (`guide_id`);

--
-- Tablo için indeksler `main_tours`
--
ALTER TABLE `main_tours`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_company_tour` (`company_ref`,`tour_name`);

--
-- Tablo için indeksler `provider_collection`
--
ALTER TABLE `provider_collection`
  ADD PRIMARY KEY (`id`),
  ADD KEY `provider_collection_ibfk_1` (`ticket_id`);

--
-- Tablo için indeksler `regionslist`
--
ALTER TABLE `regionslist`
  ADD PRIMARY KEY (`id`),
  ADD KEY `company_id` (`company_id`);

--
-- Tablo için indeksler `reservations`
--
ALTER TABLE `reservations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `reservations_ibfk_1` (`company_id`),
  ADD KEY `idx_reservations_created_at` (`created_at`),
  ADD KEY `idx_reservations_status` (`status`);

--
-- Tablo için indeksler `reservation_approve`
--
ALTER TABLE `reservation_approve`
  ADD PRIMARY KEY (`id`),
  ADD KEY `reservation_id` (`reservation_id`),
  ADD KEY `ticket_id` (`ticket_no`);

--
-- Tablo için indeksler `reservation_payments`
--
ALTER TABLE `reservation_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `reservation_id` (`reservation_id`),
  ADD KEY `idx_reservation_payments_reservation_id` (`reservation_id`);

--
-- Tablo için indeksler `reservation_tickets`
--
ALTER TABLE `reservation_tickets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `reservation_id` (`reservation_id`),
  ADD KEY `idx_reservation_tickets_date` (`date`);

--
-- Tablo için indeksler `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_permission` (`company_id`,`role_name`,`page_id`);

--
-- Tablo için indeksler `safe`
--
ALTER TABLE `safe`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_company` (`company_id`);

--
-- Tablo için indeksler `safe_records`
--
ALTER TABLE `safe_records`
  ADD PRIMARY KEY (`id`);

--
-- Tablo için indeksler `sub_tours`
--
ALTER TABLE `sub_tours`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tour_id` (`tour_id`),
  ADD KEY `company_id` (`company_id`);

--
-- Tablo için indeksler `ticket_options`
--
ALTER TABLE `ticket_options`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ticket_id` (`ticket_id`);

--
-- Tablo için indeksler `ticket_rest_amount`
--
ALTER TABLE `ticket_rest_amount`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ticket_rest_ibfk_1` (`ticket_id`);

--
-- Tablo için indeksler `tourlist`
--
ALTER TABLE `tourlist`
  ADD PRIMARY KEY (`id`),
  ADD KEY `company_id` (`company_id`);

--
-- Tablo için indeksler `tours`
--
ALTER TABLE `tours`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_company_ref` (`company_ref`),
  ADD KEY `idx_operator_id` (`operator_id`),
  ADD KEY `fk_main_tour` (`main_tour_id`);

--
-- Tablo için indeksler `tour_days`
--
ALTER TABLE `tour_days`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_tour_id` (`tour_id`);

--
-- Tablo için indeksler `tour_options`
--
ALTER TABLE `tour_options`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_tour_id` (`tour_id`);

--
-- Tablo için indeksler `tour_pickup_times`
--
ALTER TABLE `tour_pickup_times`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_tour_id` (`tour_id`),
  ADD KEY `fk_pickup_times_company` (`company_id`);

--
-- Tablo için indeksler `tour_regions`
--
ALTER TABLE `tour_regions`
  ADD PRIMARY KEY (`tour_id`,`region_name`) USING BTREE;

--
-- Tablo için indeksler `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Dökümü yapılmış tablolar için AUTO_INCREMENT değeri
--

--
-- Tablo için AUTO_INCREMENT değeri `agencyguide`
--
ALTER TABLE `agencyguide`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=493;

--
-- Tablo için AUTO_INCREMENT değeri `agencyprovider`
--
ALTER TABLE `agencyprovider`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2996;

--
-- Tablo için AUTO_INCREMENT değeri `agencyrolemembers`
--
ALTER TABLE `agencyrolemembers`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=156;

--
-- Tablo için AUTO_INCREMENT değeri `areaslist`
--
ALTER TABLE `areaslist`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4526;

--
-- Tablo için AUTO_INCREMENT değeri `companyusers`
--
ALTER TABLE `companyusers`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=136;

--
-- Tablo için AUTO_INCREMENT değeri `create_areaslist`
--
ALTER TABLE `create_areaslist`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1988;

--
-- Tablo için AUTO_INCREMENT değeri `currency_rates`
--
ALTER TABLE `currency_rates`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=221;

--
-- Tablo için AUTO_INCREMENT değeri `guide_collections`
--
ALTER TABLE `guide_collections`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1164;

--
-- Tablo için AUTO_INCREMENT değeri `guide_regions`
--
ALTER TABLE `guide_regions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=792;

--
-- Tablo için AUTO_INCREMENT değeri `main_tours`
--
ALTER TABLE `main_tours`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4143;

--
-- Tablo için AUTO_INCREMENT değeri `provider_collection`
--
ALTER TABLE `provider_collection`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=674;

--
-- Tablo için AUTO_INCREMENT değeri `regionslist`
--
ALTER TABLE `regionslist`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1215;

--
-- Tablo için AUTO_INCREMENT değeri `reservations`
--
ALTER TABLE `reservations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=850;

--
-- Tablo için AUTO_INCREMENT değeri `reservation_approve`
--
ALTER TABLE `reservation_approve`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1240;

--
-- Tablo için AUTO_INCREMENT değeri `reservation_payments`
--
ALTER TABLE `reservation_payments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1229;

--
-- Tablo için AUTO_INCREMENT değeri `reservation_tickets`
--
ALTER TABLE `reservation_tickets`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1416;

--
-- Tablo için AUTO_INCREMENT değeri `role_permissions`
--
ALTER TABLE `role_permissions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24287;

--
-- Tablo için AUTO_INCREMENT değeri `safe`
--
ALTER TABLE `safe`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=74;

--
-- Tablo için AUTO_INCREMENT değeri `safe_records`
--
ALTER TABLE `safe_records`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=729;

--
-- Tablo için AUTO_INCREMENT değeri `sub_tours`
--
ALTER TABLE `sub_tours`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4084;

--
-- Tablo için AUTO_INCREMENT değeri `ticket_options`
--
ALTER TABLE `ticket_options`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=383;

--
-- Tablo için AUTO_INCREMENT değeri `ticket_rest_amount`
--
ALTER TABLE `ticket_rest_amount`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1403;

--
-- Tablo için AUTO_INCREMENT değeri `tourlist`
--
ALTER TABLE `tourlist`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3188;

--
-- Tablo için AUTO_INCREMENT değeri `tours`
--
ALTER TABLE `tours`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10372;

--
-- Tablo için AUTO_INCREMENT değeri `tour_days`
--
ALTER TABLE `tour_days`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=72380;

--
-- Tablo için AUTO_INCREMENT değeri `tour_options`
--
ALTER TABLE `tour_options`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2581;

--
-- Tablo için AUTO_INCREMENT değeri `tour_pickup_times`
--
ALTER TABLE `tour_pickup_times`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38519;

--
-- Tablo için AUTO_INCREMENT değeri `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- Dökümü yapılmış tablolar için kısıtlamalar
--

--
-- Tablo kısıtlamaları `agencyguide`
--
ALTER TABLE `agencyguide`
  ADD CONSTRAINT `agencyguide_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companyusers` (`id`) ON DELETE CASCADE;

--
-- Tablo kısıtlamaları `agencyrolemembers`
--
ALTER TABLE `agencyrolemembers`
  ADD CONSTRAINT `agencyrolemembers_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companyusers` (`id`);

--
-- Tablo kısıtlamaları `areaslist`
--
ALTER TABLE `areaslist`
  ADD CONSTRAINT `areaslist_ibfk_1` FOREIGN KEY (`region_id`) REFERENCES `regionslist` (`id`) ON DELETE CASCADE;

--
-- Tablo kısıtlamaları `guide_collections`
--
ALTER TABLE `guide_collections`
  ADD CONSTRAINT `guide_collection` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Tablo kısıtlamaları `guide_regions`
--
ALTER TABLE `guide_regions`
  ADD CONSTRAINT `guide_regions_ibfk_1` FOREIGN KEY (`guide_id`) REFERENCES `agencyguide` (`id`) ON DELETE CASCADE;

--
-- Tablo kısıtlamaları `main_tours`
--
ALTER TABLE `main_tours`
  ADD CONSTRAINT `main_tours_1` FOREIGN KEY (`company_ref`) REFERENCES `companyusers` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

--
-- Tablo kısıtlamaları `provider_collection`
--
ALTER TABLE `provider_collection`
  ADD CONSTRAINT `provider_collection_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `reservation_tickets` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Tablo kısıtlamaları `reservations`
--
ALTER TABLE `reservations`
  ADD CONSTRAINT `reservations_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companyusers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Tablo kısıtlamaları `reservation_approve`
--
ALTER TABLE `reservation_approve`
  ADD CONSTRAINT `reservation_approve` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`) ON DELETE CASCADE;

--
-- Tablo kısıtlamaları `reservation_payments`
--
ALTER TABLE `reservation_payments`
  ADD CONSTRAINT `reservation_payments_ibfk_1` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`) ON DELETE CASCADE;

--
-- Tablo kısıtlamaları `reservation_tickets`
--
ALTER TABLE `reservation_tickets`
  ADD CONSTRAINT `reservation_tickets_ibfk_1` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`) ON DELETE CASCADE;

--
-- Tablo kısıtlamaları `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companyusers` (`id`);

--
-- Tablo kısıtlamaları `safe`
--
ALTER TABLE `safe`
  ADD CONSTRAINT `safe_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companyusers` (`id`) ON DELETE CASCADE;

--
-- Tablo kısıtlamaları `sub_tours`
--
ALTER TABLE `sub_tours`
  ADD CONSTRAINT `sub_tours_ibfk_1` FOREIGN KEY (`tour_id`) REFERENCES `tourlist` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `sub_tours_ibfk_2` FOREIGN KEY (`company_id`) REFERENCES `companyusers` (`id`) ON DELETE CASCADE;

--
-- Tablo kısıtlamaları `ticket_options`
--
ALTER TABLE `ticket_options`
  ADD CONSTRAINT `ticket_options_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `reservation_tickets` (`id`) ON DELETE CASCADE;

--
-- Tablo kısıtlamaları `ticket_rest_amount`
--
ALTER TABLE `ticket_rest_amount`
  ADD CONSTRAINT `ticket_rest_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `reservation_tickets` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

--
-- Tablo kısıtlamaları `tourlist`
--
ALTER TABLE `tourlist`
  ADD CONSTRAINT `tourlist_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companyusers` (`id`) ON DELETE CASCADE;

--
-- Tablo kısıtlamaları `tours`
--
ALTER TABLE `tours`
  ADD CONSTRAINT `fk_main_tour` FOREIGN KEY (`main_tour_id`) REFERENCES `main_tours` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT,
  ADD CONSTRAINT `tourlist_ibfk_2` FOREIGN KEY (`company_ref`) REFERENCES `companyusers` (`id`) ON DELETE CASCADE;

--
-- Tablo kısıtlamaları `tour_days`
--
ALTER TABLE `tour_days`
  ADD CONSTRAINT `tour_days_ibfk_1` FOREIGN KEY (`tour_id`) REFERENCES `tours` (`id`) ON DELETE CASCADE;

--
-- Tablo kısıtlamaları `tour_options`
--
ALTER TABLE `tour_options`
  ADD CONSTRAINT `tour_options_ibfk_1` FOREIGN KEY (`tour_id`) REFERENCES `tours` (`id`) ON DELETE CASCADE;

--
-- Tablo kısıtlamaları `tour_pickup_times`
--
ALTER TABLE `tour_pickup_times`
  ADD CONSTRAINT `tour_pickup_times_ibfk_1` FOREIGN KEY (`tour_id`) REFERENCES `tours` (`id`) ON DELETE CASCADE;

--
-- Tablo kısıtlamaları `tour_regions`
--
ALTER TABLE `tour_regions`
  ADD CONSTRAINT `tour_regions_ibfk_1` FOREIGN KEY (`tour_id`) REFERENCES `tours` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
