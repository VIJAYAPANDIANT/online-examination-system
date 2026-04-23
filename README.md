# 🛡️ Online Examination System with AI Proctoring

<div align="center">
  <img src="https://img.shields.io/badge/Status-Active-success?style=for-the-badge" alt="Status">
  <img src="https://img.shields.io/badge/Maintained%3F-yes-green.svg?style=for-the-badge" alt="Maintained">
  <img src="https://img.shields.io/github/license/VIJAYAPANDIANT/Online-Examination-System?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/badge/Spring%20Boot-3.x-brightgreen?style=for-the-badge&logo=springboot" alt="Spring Boot">
  <img src="https://img.shields.io/badge/React-20232a?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel">
</div>

<p align="center">
  <strong>A cutting-edge, full-stack platform revolutionizing academic and professional assessments with integrated AI proctoring.</strong>
  <br />
  <br />
  <a href="https://online-examination-system-m6sf.vercel.app/"><strong>Live Demo »</strong></a>
  ·
  <a href="#-getting-started">Explore the Docs</a>
  ·
  <a href="https://github.com/VIJAYAPANDIANT/Online-Examination-System/issues">Report Bug</a>
</p>

---

## 📋 Table of Contents
- [🔐 Demo Credentials](#-demo-credentials)
- [📝 Overview](#-overview)
- [🚀 Features](#-features)
  - [👨‍🎓 Student Portal](#-student-portal)
  - [🛡️ AI Proctoring System](#-ai-proctoring-system)
  - [🔧 Administrator Dashboard](#-administrator-dashboard)
- [🔄 User Workflow](#-user-workflow)
- [🛠️ Technical Stack](#-technical-stack)
- [📂 Project Structure](#-project-structure)
- [🚦 Getting Started](#-getting-started)
- [⚙️ Advanced Features](#-advanced-features)
- [🗺️ Roadmap](#-roadmap)
- [👤 Contact](#-contact)

---

## 🔐 Demo Credentials

For testing purposes, you can use the following credentials to access different portals of the platform:

| Role          | Email                           | Password     |
| :------------ | :------------------------------ | :----------- |
| **Admin**     | `vijayapandian112007@gmail.com` | `1234567890` |
| **Test User** | `vijayapandiant07@gmail.com`    | `12345`      |

---

## 📝 Overview

The **Online Examination System** is designed to bridge the gap between convenience and security in remote learning. By integrating advanced **AI Proctoring** capabilities, it ensures the integrity of examinations while providing a seamless, high-performance experience for students and administrators alike.

### Key Objectives:
- 🛡️ **Integrity First:** Prevent tab switching and unauthorized navigation via real-time monitoring.
- ⚡ **Scalability:** Robust backend powered by Spring Boot and RabbitMQ for handling concurrent submissions.
- 💻 **Versatility:** Integrated multi-language compiler for real-time coding assessments.

---

## 🚀 Features

### 👨‍🎓 Student Portal
- **Topic Selection:** Aptitude, DSA, SQL, Web Dev, and more.
- **Multi-Language Compiler:** Supports JavaScript, Python, Java, C, and C++.
- **Interactive UI:** Clean, distraction-free environment with live timers.
- **Performance Analytics:** Detailed breakdowns and global leaderboard.

### 🛡️ AI Proctoring System
Maintains integrity through a point-based violation tracking system:
- **Tab & Window Tracking:** Monitors and penalizes navigation away from the exam.
- **Restriction Suite:** Disables copy-paste, right-click, and secondary displays.
- **Automated Termination:** Session auto-closes if violation thresholds are exceeded.

### 🔧 Administrator Dashboard
- **Content Management:** Full CRUD operations for exams and questions.
- **Live Monitoring:** Real-time tracking of active student sessions.
- **Instant Alerts:** WebSocket-driven notifications for proctoring violations.

---

## 🔄 User Workflow

1.  **Authentication:** Secure registration and login to track progress.
2.  **Dashboard:** Access personalized exam topics and history.
3.  **Proctored Environment:** AI monitoring activates upon exam start.
4.  **Real-Time Assessment:** Interactive testing with optional coding challenges.
5.  **Automated Grading:** Instant submission processing and scoring.
6.  **Results & Feedback:** Immediate performance analytics and leaderboard updates.

---

## 🛠️ Technical Stack

### Frontend & UI
![React](https://img.shields.io/badge/React-20232a?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![WebSockets](https://img.shields.io/badge/WebSockets-010101?style=for-the-badge&logo=socket.io&logoColor=white)

### Backend & Database
![Java](https://img.shields.io/badge/Java_17-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)

### DevOps & Infrastructure
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white)

---

## 📂 Project Structure

```bash
Online-Examination-System/
├── backend/            # Spring Boot Microservice
│   ├── src/            # Application logic
│   ├── pom.xml         # Dependency management
│   └── Dockerfile      # Backend containerization
├── frontend/           # React + Vite Client
│   ├── src/            # Components & Hooks
│   ├── index.html      # Entry point
│   └── Dockerfile      # Frontend containerization
├── docker-compose.yml  # Full-stack orchestration
├── nginx.conf          # Reverse proxy configuration
└── README.md           # Project documentation
```

---

## 🚦 Getting Started

### Prerequisites
- [Docker](https://www.docker.com/get-started) and [Docker Compose](https://docs.docker.com/compose/install/)

### Installation & Setup
1. **Clone the repository:**
   ```bash
   git clone https://github.com/VIJAYAPANDIANT/Online-Examination-System.git
   ```
2. **Navigate to the root folder:**
   ```bash
   cd Online-Examination-System
   ```
3. **Launch the stack:**
   ```bash
   docker-compose up --build
   ```
4. **Access the application:**
   - Frontend: `http://localhost`
   - API Docs: `http://localhost:8080/swagger-ui.html`

---

## ⚙️ Advanced Features

- **Asynchronous Processing:** RabbitMQ manages high-volume submission queues.
- **Real-time Leaderboard:** Redis-powered cache for instant global rankings.
- **Security:** Server-side integrity validation and JWT-based authentication.

---

## 🗺️ Roadmap

- [ ] **Global Migration:** Scaling leaderboard to cross-platform user base.
- [ ] **Persistent Sessions:** Enhanced recovery for interrupted exams.
- [ ] **Resource Hub:** Direct integration of PDF materials.
- [ ] **AI Chatbot:** Automated support assistant.
- [ ] **Digital Certification:** Automated badge issuance for 100% scores.

---

## 👤 Contact

Created by **Vijayapandian T**

- **LinkedIn:** [vijayapandian-t](http://www.linkedin.com/in/vijayapandian-t)
- **GitHub:** [@VIJAYAPANDIANT](https://github.com/VIJAYAPANDIANT)
- **Email:** [vijayapandian112007@gmail.com](mailto:vijayapandian112007@gmail.com)

---
<div align="center">
  <p>If you like this project, please give it a ⭐!</p>
</div>
