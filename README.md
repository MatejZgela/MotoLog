# 🏍️ MotoLog

> **Offline-First Motorcycle Maintenance & Lifecycle Management Platform**  
> Built with **React Native (v0.83)**, **Expo SDK 55**, **TypeScript**, and **SQLite**.

[![React Native](https://img.shields.io/badge/React%20Native-0.83-blue.svg)](https://reactnative.dev)
[![Expo](https://img.shields.io/badge/Expo-SDK%2055-black.svg)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org)
[![SQLite](https://img.shields.io/badge/SQLite-Local--First-green.svg)](https://docs.expo.dev/versions/latest/sdk/sqlite/)
[![Sentry](https://img.shields.io/badge/Sentry-Monitored-purple.svg)](https://sentry.io)

---

## 📄 Recruiter & Engineering Portfolio Case Study

If you are a **Technical Recruiter**, **Hiring Manager**, or **Engineering Interviewer**, please see the comprehensive technical case study:

👉 **[Read the Full Engineering Portfolio & Architecture Case Study](./PORTFOLIO_CASE_STUDY.md)**

The case study covers:
- **Architectural Pivot**: Strategic migration from cloud-coupled backend (Supabase) to a 100% offline-first, zero-latency local relational engine (`expo-sqlite`).
- **Memory & Performance Engineering**: Mitigating mobile Out-Of-Memory (OOM) crashes via streaming ZIP backup pipelines and dynamic photo compression.
- **Relational Integrity**: Foreign key cascade enforcement, schema version migrations, and composite B-tree indexing.
- **Hardware & OS Integration**: Background push notifications with escalation reminders ("gentle nags"), camera capture, Android Storage Access Framework (SAF), and client-side PDF provenance reports.
- **System Design & STAR Interview Talking Points**: Concise answers to core senior mobile architecture questions.

---

## ⚡ Core Features

- 🏍️ **Multi-Bike Garage**: Track make, model, year, nickname, and live odometer.
- ⏱️ **Predictive Maintenance Engine**: Hybrid dual-interval scheduler tracking both calendar days and distance thresholds.
- 🔔 **Intelligent Local Notifications**: Scheduled alerts at custom times with follow-up reminder escalations.
- 📸 **Photo Documentation**: Before/After/Receipt capture with automated 800px resize, 70% JPEG compression, and orphan image garbage collection.
- 📑 **Service Provenance PDF**: Generate stylized maintenance reports for resale, insurance, or warranty records.
- 📦 **Data Portability**: Full ZIP export and merge/replace restoration without network dependency.
- 🛡️ **Production Observability**: Full Sentry instrumentation for crash reports, breadcrumbs, and performance traces.

---

## 📂 Source Code Quick Links

- Application Source: [`moto-log/`](./moto-log)
- SQLite Database & Transactions: [`moto-log/lib/database.ts`](./moto-log/lib/database.ts)
- Backup & ZIP Packaging: [`moto-log/lib/backupManager.ts`](./moto-log/lib/backupManager.ts)
- Media Pipeline & Orphan GC: [`moto-log/lib/imageStorage.ts`](./moto-log/lib/imageStorage.ts)
- Notification Scheduling & Channels: [`moto-log/lib/notifications.ts`](./moto-log/lib/notifications.ts)
- Technical Case Study: [`PORTFOLIO_CASE_STUDY.md`](./PORTFOLIO_CASE_STUDY.md)
