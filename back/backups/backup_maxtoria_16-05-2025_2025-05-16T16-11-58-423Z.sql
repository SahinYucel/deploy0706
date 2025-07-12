-- MySQL dump 10.13  Distrib 8.0.42, for Linux (x86_64)
--
-- Host: localhost    Database: tour_program
-- ------------------------------------------------------
-- Server version	8.0.42-0ubuntu0.24.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `agencyguide`
--

DROP TABLE IF EXISTS `agencyguide`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agencyguide` (
  `id` int NOT NULL AUTO_INCREMENT,
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
  `entitlement` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `idx_company` (`company_id`),
  CONSTRAINT `agencyguide_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companyusers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=415 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `agencyguide`
--

LOCK TABLES `agencyguide` WRITE;
/*!40000 ALTER TABLE `agencyguide` DISABLE KEYS */;
INSERT INTO `agencyguide` VALUES (412,'Şahin','Yücel',1,1,'yeniler','Guide','{\"rusca\": false, \"arapca\": false, \"almanca\": false, \"fransizca\": false, \"ingilizce\": true}','','05052325082','B1A8N8LA','123123',124,'2025-03-19 13:47:03','2025-03-19 13:47:03',40.00),(413,'Faruk','abuzer',1,1,'yeniler2','aa','{\"rusca\": false, \"arapca\": false, \"almanca\": false, \"fransizca\": false, \"ingilizce\": true}','','05052325082','PL574NOC','964400',124,'2025-03-19 13:47:03','2025-03-19 13:47:03',40.00),(414,'Salih','atmaca',1,1,'yeniler2','Guide','{\"rusca\": false, \"arapca\": true, \"almanca\": false, \"fransizca\": false, \"ingilizce\": false}','','05052325082','83GXO2V4','123123',124,'2025-03-19 13:47:03','2025-03-19 13:47:03',0.00);
/*!40000 ALTER TABLE `agencyguide` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `agencyprovider`
--

DROP TABLE IF EXISTS `agencyprovider`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agencyprovider` (
  `id` int NOT NULL AUTO_INCREMENT,
  `companyRef` varchar(50) NOT NULL,
  `company_name` varchar(50) NOT NULL,
  `phone_number` varchar(100) NOT NULL,
  `password` int DEFAULT NULL,
  `status` int NOT NULL,
  `company_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  KEY `idx_companyRef` (`companyRef`) USING BTREE,
  CONSTRAINT `agencyprovidertour` FOREIGN KEY (`company_id`) REFERENCES `companyusers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=880 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `agencyprovider`
--

LOCK TABLES `agencyprovider` WRITE;
/*!40000 ALTER TABLE `agencyprovider` DISABLE KEYS */;
INSERT INTO `agencyprovider` VALUES (872,'YR33ESMC','bulent','505 232 5040',NULL,1,124),(873,'DN4FAL1N','oncu','505 232 5082',NULL,1,124),(874,'Y5TD65HJ','paco','505 232 5040',NULL,1,124),(875,'JAD6PRC7','cuneyt','505 232 5082',NULL,1,124),(876,'5KUXUJCU','correct','53095171',NULL,1,124),(877,'IDMKOPY9','sercan','505 232 5040',123,1,124),(878,'ROALE6O7','oncu','505 232 5082',556,1,124),(879,'P76A94YC','silver','505 232 5082',123,0,124);
/*!40000 ALTER TABLE `agencyprovider` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `agencyrolemembers`
--

DROP TABLE IF EXISTS `agencyrolemembers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agencyrolemembers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `position` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `company_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `agencyrolemembers_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companyusers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=141 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `agencyrolemembers`
--

LOCK TABLES `agencyrolemembers` WRITE;
/*!40000 ALTER TABLE `agencyrolemembers` DISABLE KEYS */;
INSERT INTO `agencyrolemembers` VALUES (138,'admin','admin','$2b$10$ra1YMjRpDUdh4/.zszS1a.9i7nGYyYgesky6BJjqZFwGVt1LtAy9a',124,'2025-03-16 20:55:43'),(139,'yusuf','operasyon','$2b$10$BhQt9uFa9k3gkJIFiKOSqOfEdO97FQp2Zefi9N8rVQa/h1iXj3Yiy',124,'2025-03-17 22:45:22'),(140,'zemzem','muhasebe','$2b$10$ZAeYk.EENemcOuxLOjxmH.JDe7MPpyAhWL4nFUlE1e1PMLddFkF9u',124,'2025-03-17 22:45:56');
/*!40000 ALTER TABLE `agencyrolemembers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `areaslist`
--

DROP TABLE IF EXISTS `areaslist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `areaslist` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `region_id` int NOT NULL,
  `company_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `region_id` (`region_id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `areaslist_ibfk_1` FOREIGN KEY (`region_id`) REFERENCES `regionslist` (`id`) ON DELETE CASCADE,
  CONSTRAINT `areaslist_ibfk_2` FOREIGN KEY (`company_id`) REFERENCES `companyusers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3720 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `areaslist`
--

LOCK TABLES `areaslist` WRITE;
/*!40000 ALTER TABLE `areaslist` DISABLE KEYS */;
INSERT INTO `areaslist` VALUES (3710,'OBA',1055,124,'2025-03-19 13:40:22','2025-03-19 13:40:22'),(3711,'AVSALLAR',1055,124,'2025-03-19 13:40:22','2025-03-19 13:40:22'),(3712,'PAYALLAR',1055,124,'2025-03-19 13:40:22','2025-03-19 13:40:22'),(3713,'OKURCALAR',1055,124,'2025-03-19 13:40:22','2025-03-19 13:40:22'),(3714,'TITREYENGOL',1056,124,'2025-03-19 13:40:22','2025-03-19 13:40:22'),(3715,'KUMKOY',1056,124,'2025-03-19 13:40:22','2025-03-19 13:40:22'),(3716,'EVRENSEKI',1056,124,'2025-03-19 13:40:22','2025-03-19 13:40:22'),(3717,'SIDE',1056,124,'2025-03-19 13:40:22','2025-03-19 13:40:22'),(3718,'SORGUN',1056,124,'2025-03-19 13:40:22','2025-03-19 13:40:22'),(3719,'GUNDOGDU',1056,124,'2025-03-19 13:40:22','2025-03-19 13:40:22');
/*!40000 ALTER TABLE `areaslist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `companyusers`
--

DROP TABLE IF EXISTS `companyusers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `companyusers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_name` varchar(255) NOT NULL,
  `position` varchar(50) NOT NULL,
  `ref_code` varchar(50) NOT NULL,
  `company_user` varchar(100) NOT NULL,
  `company_pass` varchar(100) NOT NULL,
  `duration_use` varchar(20) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `verification` varchar(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=126 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `companyusers`
--

LOCK TABLES `companyusers` WRITE;
/*!40000 ALTER TABLE `companyusers` DISABLE KEYS */;
INSERT INTO `companyusers` VALUES (124,'maxtoria','Agency','MAX5188','maxtoria','$2b$10$BbZ3kx3OUs/u8FKMa3P4k.JCoc7v1UxzGEYUdkQzQ96wNw6wf7zjy','1','2025-03-16 20:55:16','COZZ9I');
/*!40000 ALTER TABLE `companyusers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `create_areaslist`
--

DROP TABLE IF EXISTS `create_areaslist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `create_areaslist` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `company_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `create_areaslist_1` (`company_id`),
  CONSTRAINT `create_areaslist_1` FOREIGN KEY (`company_id`) REFERENCES `companyusers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1696 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `create_areaslist`
--

LOCK TABLES `create_areaslist` WRITE;
/*!40000 ALTER TABLE `create_areaslist` DISABLE KEYS */;
INSERT INTO `create_areaslist` VALUES (1692,'MANAVGAT',124,'2025-03-19 13:40:22','2025-03-19 13:40:22'),(1693,'SIDE',124,'2025-03-19 13:40:22','2025-03-19 13:40:22'),(1694,'ANTALYA',124,'2025-03-19 13:40:22','2025-03-19 13:40:22'),(1695,'ALANYA',124,'2025-03-19 13:40:22','2025-03-19 13:40:22');
/*!40000 ALTER TABLE `create_areaslist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `guide_regions`
--

DROP TABLE IF EXISTS `guide_regions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `guide_regions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `guide_id` int NOT NULL,
  `company_id` int NOT NULL,
  `region_name` varchar(255) NOT NULL,
  `CREATED_AT` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `guide_id` (`guide_id`),
  CONSTRAINT `guide_regions_ibfk_1` FOREIGN KEY (`guide_id`) REFERENCES `agencyguide` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=601 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `guide_regions`
--

LOCK TABLES `guide_regions` WRITE;
/*!40000 ALTER TABLE `guide_regions` DISABLE KEYS */;
INSERT INTO `guide_regions` VALUES (597,412,124,'ALANYA','2025-03-19 13:47:03'),(598,413,124,'MANAVGAT','2025-03-19 13:47:03'),(599,414,124,'ALANYA','2025-03-19 13:47:03'),(600,414,124,'ANTALYA','2025-03-19 13:47:03');
/*!40000 ALTER TABLE `guide_regions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `main_tours`
--

DROP TABLE IF EXISTS `main_tours`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `main_tours` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_ref` varchar(255) NOT NULL,
  `tour_name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_company_tour` (`company_ref`,`tour_name`)
) ENGINE=InnoDB AUTO_INCREMENT=2854 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `main_tours`
--

LOCK TABLES `main_tours` WRITE;
/*!40000 ALTER TABLE `main_tours` DISABLE KEYS */;
INSERT INTO `main_tours` VALUES (2849,'124','ALANYA-CITY-TOUR','2025-03-18 23:26:03','2025-03-18 23:26:03'),(2850,'124','BUGGY-QUAD-AVSALLAR','2025-03-18 23:26:03','2025-03-18 23:26:03'),(2851,'124','ANTALYA-CITY-TOUR','2025-03-18 23:26:03','2025-03-18 23:26:03'),(2852,'124','MANAVGAT-CITY-TOUR','2025-03-18 23:26:03','2025-03-18 23:26:03'),(2853,'124','SCUBA-DIVING','2025-03-18 23:26:03','2025-03-18 23:26:03');
/*!40000 ALTER TABLE `main_tours` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `regionslist`
--

DROP TABLE IF EXISTS `regionslist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `regionslist` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `company_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `regionlist1` FOREIGN KEY (`company_id`) REFERENCES `companyusers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1060 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `regionslist`
--

LOCK TABLES `regionslist` WRITE;
/*!40000 ALTER TABLE `regionslist` DISABLE KEYS */;
INSERT INTO `regionslist` VALUES (1055,'ALANYA',124,'2025-03-19 13:40:22','2025-03-19 13:40:22'),(1056,'SIDE',124,'2025-03-19 13:40:22','2025-03-19 13:40:22'),(1057,'A',124,'2025-03-19 13:40:22','2025-03-19 13:40:22'),(1058,'B',124,'2025-03-19 13:40:22','2025-03-19 13:40:22'),(1059,'C',124,'2025-03-19 13:40:22','2025-03-19 13:40:22');
/*!40000 ALTER TABLE `regionslist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reservation_approve`
--

DROP TABLE IF EXISTS `reservation_approve`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservation_approve` (
  `id` int NOT NULL AUTO_INCREMENT,
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
  `provider_ref` varchar(255) DEFAULT NULL,
  `status` tinyint DEFAULT '0',
  `guide_status` tinyint DEFAULT '0',
  `provider_status` tinyint DEFAULT '0',
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `reservation_id` (`reservation_id`),
  KEY `ticket_id` (`ticket_no`)
) ENGINE=InnoDB AUTO_INCREMENT=238 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reservation_approve`
--

LOCK TABLES `reservation_approve` WRITE;
/*!40000 ALTER TABLE `reservation_approve` DISABLE KEYS */;
/*!40000 ALTER TABLE `reservation_approve` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reservation_payments`
--

DROP TABLE IF EXISTS `reservation_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservation_payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reservation_id` int NOT NULL,
  `payment_type` varchar(20) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(10) NOT NULL,
  `rest_amount` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `reservation_id` (`reservation_id`),
  CONSTRAINT `reservation_payments_ibfk_1` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=940 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reservation_payments`
--

LOCK TABLES `reservation_payments` WRITE;
/*!40000 ALTER TABLE `reservation_payments` DISABLE KEYS */;
INSERT INTO `reservation_payments` VALUES (896,542,'pos',1200.00,'EUR',500.00),(897,542,'cash',50.00,'GBP',NULL),(921,553,'cash',1000.00,'TL',NULL),(922,554,'cash',1000.00,'TL',NULL),(923,555,'cash',1500.00,'TL',NULL),(924,556,'cash',1000.00,'TL',NULL),(925,557,'cash',1000.00,'TL',NULL),(926,558,'cash',1000.00,'TL',NULL),(927,559,'cash',1000.00,'TL',NULL),(928,560,'cash',1000.00,'TL',NULL),(929,561,'cash',1000.00,'TL',NULL),(930,562,'cash',1000.00,'TL',NULL),(931,563,'cash',1000.00,'TL',NULL),(932,564,'cash',1000.00,'TL',NULL),(933,565,'cash',1000.00,'TL',NULL),(934,566,'cash',1000.00,'TL',NULL),(935,567,'cash',1000.00,'TL',NULL),(936,568,'cash',1000.00,'TL',NULL),(937,569,'cash',1000.00,'TL',NULL),(938,570,'cash',2000.00,'TL',NULL),(939,570,'card',500.00,'EUR',NULL);
/*!40000 ALTER TABLE `reservation_payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reservation_tickets`
--

DROP TABLE IF EXISTS `reservation_tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservation_tickets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reservation_id` int NOT NULL,
  `tour_name` varchar(255) NOT NULL,
  `tour_group_name` varchar(255) NOT NULL,
  `adult_count` int NOT NULL DEFAULT '0',
  `child_count` int NOT NULL DEFAULT '0',
  `free_count` int NOT NULL DEFAULT '0',
  `currency` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'TL',
  `date` date DEFAULT NULL,
  `comment` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `regions` varchar(50) NOT NULL,
  `guide_ref` varchar(50) DEFAULT NULL,
  `guide_name` varchar(50) NOT NULL,
  `provider_name` varchar(255) DEFAULT NULL,
  `provider_ref` varchar(255) DEFAULT NULL,
  `time` varchar(10) DEFAULT NULL,
  `adult_price` decimal(10,2) DEFAULT NULL,
  `half_price` decimal(10,2) DEFAULT NULL,
  `total_rest_amount` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `cancellation_reason` varchar(255) DEFAULT NULL,
  `status` tinyint NOT NULL DEFAULT '1',
  `ticket_number` varchar(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_reservation_id` (`reservation_id`),
  KEY `idx_date` (`date`),
  KEY `idx_status` (`status`),
  CONSTRAINT `reservation_tickets_ibfk_1` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=946 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reservation_tickets`
--

LOCK TABLES `reservation_tickets` WRITE;
/*!40000 ALTER TABLE `reservation_tickets` DISABLE KEYS */;
INSERT INTO `reservation_tickets` VALUES (903,542,'ALY-CITY-CRT','ALANYA-CITY-TOUR',1,2,0,'EUR','2025-03-18',NULL,'SIDE','B1A8N8LA','Şahin','correct','5KUXUJCU','08:30',25.00,30.00,NULL,NULL,1,'670968'),(904,542,'ALY-CITY-CRT','ALANYA-CITY-TOUR',1,0,0,'EUR','2025-03-18',NULL,'SIDE','B1A8N8LA','Şahin','correct','5KUXUJCU','08:30',25.00,30.00,NULL,NULL,1,'571234'),(905,542,'SLVR-DVNG','SCUBA-DIVING',1,2,0,'GBP','2025-03-17',NULL,'SIDE','B1A8N8LA','Şahin','silver','P76A94YC','09:00',30.00,25.00,'500 EUR',NULL,1,'028032'),(928,553,'ANT-CITY-ONC','ANTALYA-CITY-TOUR',1,0,0,'EUR','2025-03-19',NULL,'MANAVGAT,SIDE','NA5RYRKB','Şahin','oncu','LAPIF7U6','09:00',35.00,30.00,NULL,NULL,1,'141728'),(929,554,'ANT-CITY-ONC','ANTALYA-CITY-TOUR',1,0,0,'EUR','2025-03-19',NULL,'MANAVGAT,SIDE','NA5RYRKB','Şahin','oncu','LAPIF7U6','09:00',35.00,30.00,NULL,NULL,1,'815966'),(930,555,'ANT-CITY-ONC','ANTALYA-CITY-TOUR',1,0,0,'EUR','2025-03-19',NULL,'MANAVGAT,SIDE','NA5RYRKB','Şahin','oncu','LAPIF7U6','09:00',35.00,30.00,NULL,NULL,1,'273581'),(931,556,'ANT-CITY-ONC','ANTALYA-CITY-TOUR',1,0,0,'EUR','2025-03-19',NULL,'MANAVGAT,SIDE','NA5RYRKB','Şahin','oncu','LAPIF7U6','09:00',35.00,30.00,NULL,NULL,1,'541311'),(932,557,'ANT-CITY-ONC','ANTALYA-CITY-TOUR',1,0,0,'EUR','2025-03-19',NULL,'MANAVGAT,SIDE','NA5RYRKB','Şahin','oncu','LAPIF7U6','09:00',35.00,30.00,NULL,NULL,1,'484770'),(933,558,'ANT-CITY-ONC','ANTALYA-CITY-TOUR',1,0,0,'EUR','2025-03-19',NULL,'MANAVGAT,SIDE','NA5RYRKB','Şahin','oncu','LAPIF7U6','09:00',35.00,30.00,NULL,NULL,1,'450605'),(934,559,'ANT-CITY-ONC','ANTALYA-CITY-TOUR',1,0,0,'EUR','2025-03-19',NULL,'MANAVGAT,SIDE','NA5RYRKB','Şahin','oncu','LAPIF7U6','09:00',35.00,30.00,NULL,NULL,1,'058222'),(935,560,'ANT-CITY-ONC','ANTALYA-CITY-TOUR',1,0,0,'EUR','2025-03-19',NULL,'MANAVGAT,SIDE','NA5RYRKB','Şahin','oncu','LAPIF7U6','09:00',35.00,30.00,NULL,NULL,1,'546867'),(936,561,'ANT-CITY-ONC','ANTALYA-CITY-TOUR',1,0,0,'EUR','2025-03-19',NULL,'MANAVGAT,SIDE','NA5RYRKB','Şahin','oncu','LAPIF7U6','09:00',35.00,30.00,NULL,NULL,1,'103595'),(937,562,'ANT-CITY-ONC','ANTALYA-CITY-TOUR',1,0,0,'EUR','2025-03-19',NULL,'MANAVGAT,SIDE','NA5RYRKB','Şahin','oncu','LAPIF7U6','09:00',35.00,30.00,NULL,NULL,1,'810001'),(938,563,'ANT-CITY-ONC','ANTALYA-CITY-TOUR',1,0,0,'EUR','2025-03-19',NULL,'MANAVGAT,SIDE','NA5RYRKB','Şahin','oncu','LAPIF7U6','09:00',35.00,30.00,NULL,NULL,1,'610959'),(939,564,'ANT-CITY-ONC','ANTALYA-CITY-TOUR',1,0,0,'EUR','2025-03-19',NULL,'MANAVGAT,SIDE','NA5RYRKB','Şahin','oncu','LAPIF7U6','09:00',35.00,30.00,NULL,NULL,1,'786192'),(940,565,'ANT-CITY-ONC','ANTALYA-CITY-TOUR',1,0,0,'EUR','2025-03-19',NULL,'MANAVGAT,SIDE','NA5RYRKB','Şahin','oncu','LAPIF7U6','09:00',35.00,30.00,NULL,NULL,1,'347154'),(941,566,'ANT-CITY-ONC','ANTALYA-CITY-TOUR',1,0,0,'EUR','2025-03-19',NULL,'MANAVGAT,SIDE','NA5RYRKB','Şahin','oncu','LAPIF7U6','09:00',35.00,30.00,NULL,NULL,1,'158544'),(942,567,'ANT-CITY-ONC','ANTALYA-CITY-TOUR',1,0,0,'EUR','2025-03-19',NULL,'MANAVGAT,SIDE','NA5RYRKB','Şahin','oncu','LAPIF7U6','09:00',35.00,30.00,NULL,NULL,1,'293270'),(943,568,'ANT-CITY-ONC','ANTALYA-CITY-TOUR',1,0,0,'EUR','2025-03-19',NULL,'MANAVGAT,SIDE','NA5RYRKB','Şahin','oncu','LAPIF7U6','09:00',35.00,30.00,NULL,NULL,1,'585794'),(944,569,'ANT-CITY-ONC','ANTALYA-CITY-TOUR',1,0,0,'EUR','2025-03-19',NULL,'MANAVGAT,SIDE','NA5RYRKB','Şahin','oncu','LAPIF7U6','09:00',35.00,30.00,NULL,NULL,1,'448848'),(945,570,'MNV-CITY-ONC','MANAVGAT-CITY-TOUR',1,2,0,'EUR','2025-03-14',NULL,'MANAVGAT,SIDE','NA5RYRKB','Şahin','oncu','LAPIF7U6','09:00',35.00,30.00,'200 EUR',NULL,1,'035175');
/*!40000 ALTER TABLE `reservation_tickets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reservations`
--

DROP TABLE IF EXISTS `reservations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservations` (
  `id` int NOT NULL AUTO_INCREMENT,
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
  `currency_rates` varchar(255) DEFAULT NULL,
  `company_id` int DEFAULT NULL,
  `cost` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_company_id` (`company_id`),
  KEY `idx_status` (`status`) USING BTREE,
  CONSTRAINT `reservations_ibfk_1` FOREIGN KEY (`id`) REFERENCES `reservation_tickets` (`reservation_id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=571 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reservations`
--

LOCK TABLES `reservations` WRITE;
/*!40000 ALTER TABLE `reservations` DISABLE KEYS */;
INSERT INTO `reservations` VALUES (542,'Freddy Cakmaklar','+44123','10','Casdival','2025-03-16 18:33:38',3,'Şahin Yücel','',40.00,1,'USD:36.5922, EUR:40.0133, GBP:47.4421',124,190.00),(553,'Alex','+44102348410','1055','Diamond','2025-03-19 12:48:25',1,'Şahin Yücel',NULL,40.00,1,'USD:37.9839,EUR:41.4214,GBP:49.1920',124,0.00),(554,'Alex','+44102348410','1055','Diamond','2025-03-19 12:48:30',1,'Şahin Yücel',NULL,40.00,1,'USD:37.9839,EUR:41.4214,GBP:49.1920',124,0.00),(555,'Alex','+44102348410','1055','Diamond','2025-03-19 12:48:36',1,'Şahin Yücel',NULL,40.00,1,'USD:37.9839,EUR:41.4214,GBP:49.1920',124,0.00),(556,'Alex','+44102348410','1055','Diamond','2025-03-19 09:48:41',1,'Şahin Yücel','',40.00,1,'USD:37.9839, EUR:41.4214, GBP:49.192',124,0.00),(557,'Alex','+44102348410','1055','Diamond','2025-03-19 12:49:14',1,'Şahin Yücel',NULL,40.00,1,'USD:37.9839,EUR:41.4214,GBP:49.1920',124,0.00),(558,'Alex','+44102348410','1055','Diamondi','2025-03-19 12:49:21',1,'Şahin Yücel',NULL,40.00,1,'USD:37.9839,EUR:41.4214,GBP:49.1920',124,0.00),(559,'Alex','+44102348410','1055','Diamondi','2025-03-19 12:49:26',1,'Şahin Yücel',NULL,40.00,1,'USD:37.9839,EUR:41.4214,GBP:49.1920',124,0.00),(560,'Alex','+44102348410','1055','Diamondiş','2025-03-19 12:49:33',1,'Şahin Yücel',NULL,40.00,1,'USD:37.9839,EUR:41.4214,GBP:49.1920',124,0.00),(561,'Alex','+44102348410','1055','Diamondiş','2025-03-19 12:49:38',1,'Şahin Yücel',NULL,40.00,1,'USD:37.9839,EUR:41.4214,GBP:49.1920',124,0.00),(562,'Alex','+44102348410','1055','Diamondiş','2025-03-19 12:49:53',1,'Şahin Yücel',NULL,40.00,1,'USD:37.9839,EUR:41.4214,GBP:49.1920',124,0.00),(563,'Alex','+44102348410','1055','Diamondiş','2025-03-19 12:49:59',1,'Şahin Yücel',NULL,40.00,1,'USD:37.9839,EUR:41.4214,GBP:49.1920',124,0.00),(564,'Alex','+44102348410','1055','Diamondiş','2025-03-19 12:50:05',1,'Şahin Yücel',NULL,40.00,1,'USD:37.9839,EUR:41.4214,GBP:49.1920',124,0.00),(565,'Alex','+44102348410','1055','Diamondiş','2025-03-19 12:50:10',1,'Şahin Yücel',NULL,40.00,1,'USD:37.9839,EUR:41.4214,GBP:49.1920',124,0.00),(566,'Alex De Souza','+44102348410','1055','Diamondiş','2025-03-19 09:50:41',1,'Şahin Yücel','',40.00,1,'USD:37.9839, EUR:41.4214, GBP:49.192',124,0.00),(567,'Alex','+44102348410','1055','Diamondiş','2025-03-19 12:50:46',1,'Şahin Yücel',NULL,40.00,1,'USD:37.9839,EUR:41.4214,GBP:49.1920',124,0.00),(568,'Alex','+44102348410','1055','Diamondiş','2025-03-19 12:50:52',1,'Şahin Yücel',NULL,40.00,1,'USD:37.9839,EUR:41.4214,GBP:49.1920',124,0.00),(569,'Alex','+44102348410','1055','Diamondiş','2025-03-19 12:50:57',1,'Şahin Yücel',NULL,40.00,1,'USD:37.9839,EUR:41.4214,GBP:49.1920',124,0.00),(570,'Alex','+441023','1055','Diamon','2025-03-19 12:51:03',1,'Faruk abuzer ','hazir\n',40.00,1,'USD:37.9839, EUR:40.3, GBP:49.192',124,95.00);
/*!40000 ALTER TABLE `reservations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_id` int NOT NULL,
  `role_name` varchar(50) NOT NULL,
  `page_id` varchar(50) NOT NULL,
  `has_permission` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_permission` (`company_id`,`role_name`,`page_id`),
  CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companyusers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20399 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` VALUES (20367,124,'muhasebe','dashboard',1,'2025-03-17 22:48:05','2025-03-17 22:48:05'),(20368,124,'muhasebe','definitions',0,'2025-03-17 22:48:05','2025-03-17 22:48:05'),(20369,124,'muhasebe','companies',0,'2025-03-17 22:48:05','2025-03-17 22:48:05'),(20370,124,'muhasebe','guides',0,'2025-03-17 22:48:05','2025-03-17 22:48:05'),(20371,124,'muhasebe','create-tour',0,'2025-03-17 22:48:05','2025-03-17 22:48:05'),(20372,124,'muhasebe','tour-lists',0,'2025-03-17 22:48:05','2025-03-17 22:48:05'),(20373,124,'muhasebe','reservations',1,'2025-03-17 22:48:05','2025-03-17 22:48:05'),(20374,124,'muhasebe','reservation-send',1,'2025-03-17 22:48:05','2025-03-17 22:48:05'),(20375,124,'muhasebe','reservation-approve',1,'2025-03-17 22:48:05','2025-03-17 22:48:05'),(20376,124,'muhasebe','reservation-list',1,'2025-03-17 22:48:05','2025-03-17 22:48:05'),(20377,124,'muhasebe','reports',0,'2025-03-17 22:48:05','2025-03-17 22:48:05'),(20378,124,'muhasebe','safe',0,'2025-03-17 22:48:05','2025-03-17 22:48:05'),(20379,124,'muhasebe','safe-management',0,'2025-03-17 22:48:05','2025-03-17 22:48:05'),(20380,124,'muhasebe','safe-collection',0,'2025-03-17 22:48:05','2025-03-17 22:48:05'),(20381,124,'muhasebe','backup',0,'2025-03-17 22:48:05','2025-03-17 22:48:05'),(20382,124,'muhasebe','settings',0,'2025-03-17 22:48:05','2025-03-17 22:48:05'),(20383,124,'operasyon','dashboard',1,'2025-03-17 22:48:05','2025-03-17 22:48:05'),(20384,124,'operasyon','definitions',0,'2025-03-17 22:48:05','2025-03-17 22:48:05'),(20385,124,'operasyon','companies',0,'2025-03-17 22:48:05','2025-03-17 22:48:05'),(20386,124,'operasyon','guides',0,'2025-03-17 22:48:05','2025-03-17 22:48:05'),(20387,124,'operasyon','create-tour',0,'2025-03-17 22:48:05','2025-03-17 22:48:05'),(20388,124,'operasyon','tour-lists',0,'2025-03-17 22:48:05','2025-03-17 22:48:05'),(20389,124,'operasyon','reservations',1,'2025-03-17 22:48:05','2025-03-17 22:48:05'),(20390,124,'operasyon','reservation-send',1,'2025-03-17 22:48:05','2025-03-17 22:48:05'),(20391,124,'operasyon','reservation-approve',1,'2025-03-17 22:48:05','2025-03-17 22:48:05'),(20392,124,'operasyon','reservation-list',1,'2025-03-17 22:48:05','2025-03-17 22:48:05'),(20393,124,'operasyon','reports',0,'2025-03-17 22:48:05','2025-03-17 22:48:05'),(20394,124,'operasyon','safe',0,'2025-03-17 22:48:05','2025-03-17 22:48:05'),(20395,124,'operasyon','safe-management',0,'2025-03-17 22:48:05','2025-03-17 22:48:05'),(20396,124,'operasyon','safe-collection',0,'2025-03-17 22:48:05','2025-03-17 22:48:05'),(20397,124,'operasyon','backup',0,'2025-03-17 22:48:05','2025-03-17 22:48:05'),(20398,124,'operasyon','settings',0,'2025-03-17 22:48:05','2025-03-17 22:48:05');
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `safe`
--

DROP TABLE IF EXISTS `safe`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `safe` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('cash','pos') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `pos_commission_rate` decimal(5,2) DEFAULT NULL,
  `balance` decimal(10,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_company` (`company_id`),
  CONSTRAINT `safe_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companyusers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `safe`
--

LOCK TABLES `safe` WRITE;
/*!40000 ALTER TABLE `safe` DISABLE KEYS */;
/*!40000 ALTER TABLE `safe` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sub_tours`
--

DROP TABLE IF EXISTS `sub_tours`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sub_tours` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `tour_id` int NOT NULL,
  `company_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `tour_id` (`tour_id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `sub_tours_ibfk_1` FOREIGN KEY (`tour_id`) REFERENCES `tourlist` (`id`) ON DELETE CASCADE,
  CONSTRAINT `sub_tours_ibfk_2` FOREIGN KEY (`company_id`) REFERENCES `companyusers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3108 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sub_tours`
--

LOCK TABLES `sub_tours` WRITE;
/*!40000 ALTER TABLE `sub_tours` DISABLE KEYS */;
INSERT INTO `sub_tours` VALUES (3094,'ANT-CITY-CRT',2543,124),(3095,'ANT-CITY-ONC',2543,124),(3096,'ALY-CITY-CRT',2544,124),(3097,'ALY-CITY-ONC',2544,124),(3098,'LOL-NIGHT-CRT',2545,124),(3099,'LOL-NIGHT-ONC',2545,124),(3100,'QUAD-SNG-BLT',2546,124),(3101,'QUAD-DBL-BLT',2546,124),(3102,'BUGGY-DBL-BLT',2546,124),(3103,'BUGGY-SNL-BLT',2546,124),(3104,'HRS-RIDING-SRC',2547,124),(3105,'MNV-CITY-ONC',2548,124),(3106,'MNV-CITY-VELI',2548,124),(3107,'SLVR-DVNG',2549,124);
/*!40000 ALTER TABLE `sub_tours` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket_options`
--

DROP TABLE IF EXISTS `ticket_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ticket_options` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ticket_id` int NOT NULL,
  `option_name` varchar(255) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ticket_id` (`ticket_id`),
  CONSTRAINT `ticket_options_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `reservation_tickets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=357 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_options`
--

LOCK TABLES `ticket_options` WRITE;
/*!40000 ALTER TABLE `ticket_options` DISABLE KEYS */;
INSERT INTO `ticket_options` VALUES (356,945,'cave',3.00);
/*!40000 ALTER TABLE `ticket_options` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tour_days`
--

DROP TABLE IF EXISTS `tour_days`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tour_days` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tour_id` int NOT NULL,
  `day_number` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tour_id` (`tour_id`),
  CONSTRAINT `tour_days_ibfk_1` FOREIGN KEY (`tour_id`) REFERENCES `tours` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=61278 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tour_days`
--

LOCK TABLES `tour_days` WRITE;
/*!40000 ALTER TABLE `tour_days` DISABLE KEYS */;
INSERT INTO `tour_days` VALUES (61229,8779,1,'2025-03-18 23:26:03'),(61230,8779,2,'2025-03-18 23:26:03'),(61231,8779,3,'2025-03-18 23:26:03'),(61232,8779,0,'2025-03-18 23:26:03'),(61233,8779,0,'2025-03-18 23:26:03'),(61234,8779,0,'2025-03-18 23:26:03'),(61235,8779,0,'2025-03-18 23:26:03'),(61236,8780,1,'2025-03-18 23:26:03'),(61237,8780,2,'2025-03-18 23:26:03'),(61238,8780,3,'2025-03-18 23:26:03'),(61239,8780,4,'2025-03-18 23:26:03'),(61240,8780,5,'2025-03-18 23:26:03'),(61241,8780,6,'2025-03-18 23:26:03'),(61242,8780,7,'2025-03-18 23:26:03'),(61243,8781,1,'2025-03-18 23:26:03'),(61244,8781,2,'2025-03-18 23:26:03'),(61245,8781,3,'2025-03-18 23:26:03'),(61246,8781,4,'2025-03-18 23:26:03'),(61247,8781,5,'2025-03-18 23:26:03'),(61248,8781,6,'2025-03-18 23:26:03'),(61249,8781,7,'2025-03-18 23:26:03'),(61250,8782,1,'2025-03-18 23:26:03'),(61251,8782,2,'2025-03-18 23:26:03'),(61252,8782,3,'2025-03-18 23:26:03'),(61253,8782,0,'2025-03-18 23:26:03'),(61254,8782,0,'2025-03-18 23:26:03'),(61255,8782,0,'2025-03-18 23:26:03'),(61256,8782,0,'2025-03-18 23:26:03'),(61257,8783,1,'2025-03-18 23:26:03'),(61258,8783,0,'2025-03-18 23:26:03'),(61259,8783,3,'2025-03-18 23:26:03'),(61260,8783,0,'2025-03-18 23:26:03'),(61261,8783,5,'2025-03-18 23:26:03'),(61262,8783,0,'2025-03-18 23:26:03'),(61263,8783,0,'2025-03-18 23:26:03'),(61264,8784,1,'2025-03-18 23:26:03'),(61265,8784,2,'2025-03-18 23:26:03'),(61266,8784,3,'2025-03-18 23:26:03'),(61267,8784,4,'2025-03-18 23:26:03'),(61268,8784,5,'2025-03-18 23:26:03'),(61269,8784,6,'2025-03-18 23:26:03'),(61270,8784,7,'2025-03-18 23:26:03'),(61271,8785,1,'2025-03-18 23:26:03'),(61272,8785,0,'2025-03-18 23:26:03'),(61273,8785,3,'2025-03-18 23:26:03'),(61274,8785,0,'2025-03-18 23:26:03'),(61275,8785,0,'2025-03-18 23:26:03'),(61276,8785,0,'2025-03-18 23:26:03'),(61277,8785,0,'2025-03-18 23:26:03');
/*!40000 ALTER TABLE `tour_days` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tour_options`
--

DROP TABLE IF EXISTS `tour_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tour_options` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tour_id` int NOT NULL,
  `option_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(10,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tour_id` (`tour_id`),
  CONSTRAINT `tour_options_ibfk_1` FOREIGN KEY (`tour_id`) REFERENCES `tours` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3029 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tour_options`
--

LOCK TABLES `tour_options` WRITE;
/*!40000 ALTER TABLE `tour_options` DISABLE KEYS */;
INSERT INTO `tour_options` VALUES (3023,8780,'kask',3.00,'2025-03-18 23:26:03'),(3024,8780,'cave',5.00,'2025-03-18 23:26:03'),(3025,8782,'cave',3.00,'2025-03-18 23:26:03'),(3026,8782,'waterfall',5.00,'2025-03-18 23:26:03'),(3027,8782,'ice-cream',5.00,'2025-03-18 23:26:03'),(3028,8783,'cave',3.00,'2025-03-18 23:26:03');
/*!40000 ALTER TABLE `tour_options` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tour_pickup_times`
--

DROP TABLE IF EXISTS `tour_pickup_times`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tour_pickup_times` (
  `id` int NOT NULL AUTO_INCREMENT,
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
  `end_pickup_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_tour_id` (`tour_id`),
  KEY `fk_pickup_times_company` (`company_id`),
  CONSTRAINT `tour_pickup_times_ibfk_1` FOREIGN KEY (`tour_id`) REFERENCES `tours` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=35870 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tour_pickup_times`
--

LOCK TABLES `tour_pickup_times` WRITE;
/*!40000 ALTER TABLE `tour_pickup_times` DISABLE KEYS */;
INSERT INTO `tour_pickup_times` VALUES (35847,8779,'08','30','SIDE','TITREYENGOL',1,'1',124,'2025-03-18 23:26:03',NULL,NULL),(35848,8779,'09','00','SIDE','TITREYENGOL',1,'2',124,'2025-03-18 23:26:03',NULL,NULL),(35849,8779,'08','45','SIDE','EVRENSEKI',1,'1',124,'2025-03-18 23:26:03',NULL,NULL),(35850,8779,'08','30','SIDE','KUMKOY',1,'1',124,'2025-03-18 23:26:03',NULL,NULL),(35851,8780,'08','30','SIDE','TITREYENGOL',1,'1',124,'2025-03-18 23:26:03',NULL,NULL),(35852,8780,'09','00','SIDE','TITREYENGOL',1,'2',124,'2025-03-18 23:26:03',NULL,NULL),(35853,8780,'08','45','SIDE','EVRENSEKI',1,'1',124,'2025-03-18 23:26:03',NULL,NULL),(35854,8780,'08','30','SIDE','KUMKOY',1,'1',124,'2025-03-18 23:26:03',NULL,NULL),(35855,8781,'08','30','SIDE','TITREYENGOL',1,'1',124,'2025-03-18 23:26:03',NULL,NULL),(35856,8781,'09','00','SIDE','TITREYENGOL',1,'2',124,'2025-03-18 23:26:03',NULL,NULL),(35857,8781,'08','45','SIDE','EVRENSEKI',1,'1',124,'2025-03-18 23:26:03',NULL,NULL),(35858,8781,'08','30','SIDE','KUMKOY',1,'1',124,'2025-03-18 23:26:03',NULL,NULL),(35859,8782,'08','30','SIDE','TITREYENGOL',1,'1',124,'2025-03-18 23:26:03',NULL,NULL),(35860,8782,'09','00','SIDE','TITREYENGOL',1,'2',124,'2025-03-18 23:26:03',NULL,NULL),(35861,8782,'08','45','SIDE','EVRENSEKI',1,'1',124,'2025-03-18 23:26:03',NULL,NULL),(35862,8782,'08','30','SIDE','KUMKOY',1,'1',124,'2025-03-18 23:26:03',NULL,NULL),(35863,8783,'08','30','SIDE','GUNDOGDU',1,'1',124,'2025-03-18 23:26:03',NULL,NULL),(35864,8784,'08','30','SIDE','TITREYENGOL',1,'1',124,'2025-03-18 23:26:03',NULL,NULL),(35865,8784,'09','00','SIDE','TITREYENGOL',1,'2',124,'2025-03-18 23:26:03',NULL,NULL),(35866,8784,'08','45','SIDE','EVRENSEKI',1,'1',124,'2025-03-18 23:26:03',NULL,NULL),(35867,8784,'08','30','SIDE','KUMKOY',1,'1',124,'2025-03-18 23:26:03',NULL,NULL),(35868,8785,'08','30','SIDE','KUMKOY',1,'1',124,'2025-03-18 23:26:03',NULL,NULL),(35869,8785,'09','00','SIDE','EVRENSEKI',1,'1',124,'2025-03-18 23:26:03',NULL,NULL);
/*!40000 ALTER TABLE `tour_pickup_times` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tour_regions`
--

DROP TABLE IF EXISTS `tour_regions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tour_regions` (
  `tour_id` int NOT NULL,
  `company_id` int NOT NULL,
  `region_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  PRIMARY KEY (`tour_id`,`region_name`) USING BTREE,
  CONSTRAINT `tour_regions_ibfk_1` FOREIGN KEY (`tour_id`) REFERENCES `tours` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tour_regions`
--

LOCK TABLES `tour_regions` WRITE;
/*!40000 ALTER TABLE `tour_regions` DISABLE KEYS */;
INSERT INTO `tour_regions` VALUES (8779,124,'SIDE'),(8780,124,'ALANYA'),(8781,124,'ALANYA'),(8782,124,'ALANYA'),(8782,124,'MANAVGAT'),(8782,124,'SIDE'),(8783,124,'MANAVGAT'),(8784,124,'MANAVGAT'),(8785,124,'ALANYA'),(8785,124,'SIDE');
/*!40000 ALTER TABLE `tour_regions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tourlist`
--

DROP TABLE IF EXISTS `tourlist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tourlist` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `company_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `tourlist_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companyusers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2550 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tourlist`
--

LOCK TABLES `tourlist` WRITE;
/*!40000 ALTER TABLE `tourlist` DISABLE KEYS */;
INSERT INTO `tourlist` VALUES (2543,'ANTALYA-CITY-TOUR',124,'2025-03-19 13:40:22','2025-03-19 13:40:22'),(2544,'ALANYA-CITY-TOUR',124,'2025-03-19 13:40:22','2025-03-19 13:40:22'),(2545,'LAND-OF-LEGENDS',124,'2025-03-19 13:40:22','2025-03-19 13:40:22'),(2546,'BUGGY-QUAD-AVSALLAR',124,'2025-03-19 13:40:22','2025-03-19 13:40:22'),(2547,'HORSE-RIDING',124,'2025-03-19 13:40:22','2025-03-19 13:40:22'),(2548,'MANAVGAT-CITY-TOUR',124,'2025-03-19 13:40:22','2025-03-19 13:40:22'),(2549,'SCUBA-DIVING',124,'2025-03-19 13:40:22','2025-03-19 13:40:22');
/*!40000 ALTER TABLE `tourlist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tours`
--

DROP TABLE IF EXISTS `tours`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tours` (
  `id` int NOT NULL AUTO_INCREMENT,
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
  `main_tour_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_company_ref` (`company_ref`),
  KEY `idx_operator_id` (`operator_id`),
  KEY `fk_main_tour` (`main_tour_id`),
  CONSTRAINT `fk_main_tour` FOREIGN KEY (`main_tour_id`) REFERENCES `main_tours` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT `tourlist_ibfk_2` FOREIGN KEY (`company_ref`) REFERENCES `companyusers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8786 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tours`
--

LOCK TABLES `tours` WRITE;
/*!40000 ALTER TABLE `tours` DISABLE KEYS */;
INSERT INTO `tours` VALUES (8779,124,'ALY-CITY-CRT','correct','5KUXUJCU',25.00,35.00,30.00,30.00,1,'2025-03-18 23:26:03','2025-03-18 23:26:03',0,'','EUR',NULL,NULL,2849),(8780,124,'QUAD-SNG-BLT','bulent','YR33ESMC',25.00,35.00,30.00,30.00,1,'2025-03-18 23:26:03','2025-03-18 23:26:03',0,'','EUR',NULL,NULL,2850),(8781,124,'QUAD-DBL-BLT','bulent','YR33ESMC',25.00,35.00,30.00,30.00,1,'2025-03-18 23:26:03','2025-03-18 23:26:03',0,'','EUR',NULL,NULL,2850),(8782,124,'ANT-CITY-CRT','oncu','DN4FAL1N',15.00,35.00,20.00,30.00,1,'2025-03-18 23:26:03','2025-03-18 23:26:03',1,'','EUR',NULL,NULL,2851),(8783,124,'MNV-CITY-ONC','oncu','DN4FAL1N',35.00,25.00,30.00,20.00,1,'2025-03-18 23:26:03','2025-03-18 23:26:03',0,'','EUR',NULL,NULL,2852),(8784,124,'ANT-CITY-ONC','oncu','DN4FAL1N',20.00,25.00,15.00,20.00,1,'2025-03-18 23:26:03','2025-03-18 23:26:03',2,'','EUR',NULL,NULL,2851),(8785,124,'SLVR-DVNG','silver','P76A94YC',30.00,35.00,25.00,30.00,1,'2025-03-18 23:26:03','2025-03-18 23:26:03',0,'','GBP',NULL,NULL,2853);
/*!40000 ALTER TABLE `tours` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_turkish_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`sahin`@`%`*/ /*!50003 TRIGGER `delete_main_tour_after_tour_delete` AFTER DELETE ON `tours` FOR EACH ROW BEGIN
    DELETE FROM main_tours
    WHERE id = OLD.main_tour_id
    AND NOT EXISTS (
        SELECT 1 FROM tours WHERE main_tour_id = OLD.main_tour_id
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (34,'sahin','sahinyucel@yandex.com','$2b$10$HxPEFsFq.6VPFSkBZ3dNXu2Z45R1BLtqLT.UNN5bfO4StdQFD78om');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-05-16 19:11:58
