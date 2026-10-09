# AEGIS-SOC-GRC
### An Integrated Security Operations and Governance, Risk & Compliance Platform

AEGIS-SOC-GRC is a cybersecurity project that demonstrates how security monitoring, alert management, incident handling, risk management, compliance controls, remediation, and evidence collection can work together in a unified platform.

The project connects **Security Operations Center (SOC)** workflows with **Governance, Risk, and Compliance (GRC)** processes to demonstrate a practical security lifecycle.

## Overview

Security operations and compliance activities are often handled through separate workflows. AEGIS-SOC-GRC demonstrates an integrated approach by connecting simulated security events to detection rules, alerts, incidents, and governance-related activities.

The platform is designed as a hands-on cybersecurity engineering project that explores security monitoring, backend API development, database integration, and GRC workflows.

## Key Features

- **Security Event Simulation:** Generates controlled synthetic security telemetry for testing.
- **Detection Engine:** Evaluates security events against configured detection rules.
- **Alert Management:** Supports the creation, tracking, and updating of security alerts.
- **Incident Management:** Demonstrates the relationship between security detections and incident workflows.
- **Asset Management:** Maintains security asset information.
- **Risk Management:** Supports tracking risks and their associated remediation activities.
- **Compliance Controls:** Connects security and risk activities with governance and compliance requirements.
- **Evidence Management:** Supports evidence collection and SHA-256 integrity verification.
- **Control Testing:** Demonstrates control verification and compliance traceability.
- **Audit and Reporting:** Supports audit-related records and security reporting workflows.

## SOC-to-GRC Workflow

The platform demonstrates the following workflow:

1. **Scenario Simulation** — generate synthetic security events.
2. **Event Processing** — submit and process the generated telemetry.
3. **Detection** — evaluate events using configured detection rules.
4. **Alert Generation** — create or update alerts based on detection results.
5. **Incident Workflow** — connect detections with incident handling.
6. **Risk and Remediation** — relate security findings to risk-management activities.
7. **Evidence and Compliance** — support evidence integrity, control verification, and audit traceability.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React, TypeScript |
| Backend | Python, FastAPI |
| Database | PostgreSQL |
| Containerization | Docker |
| API Communication | REST APIs |
| Security Simulation | Custom AEGIS Scenario Engine |
| Evidence Integrity | SHA-256 hashing |

## Project Structure

The repository contains the frontend, backend, and supporting project documentation.

```text
AEGIS-SOC-GRC/
â”œâ”€â”€ backend/
â”œâ”€â”€ frontend/
â”œâ”€â”€ simulator/
â”œâ”€â”€ docs/
â”‚   â”œâ”€â”€ AEGIS-SOC-GRC-Project-Report.pdf
â”‚   â””â”€â”€ screenshots/
â”œâ”€â”€ README.md
â”œâ”€â”€ .gitignore
â””â”€â”€ .env.example
```

*Note: The structure above is a suggested presentation. Adjust it to match the actual folders and files in the repository before publishing.*

## Running Locally

AEGIS-SOC-GRC is intended to run in a local development environment.

### Prerequisites

- Python
- Node.js and npm
- PostgreSQL or the project's configured Docker database
- Git

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd AEGIS-SOC-GRC
```

### 2. Configure the backend

Follow the project's backend dependency and environment configuration files. Set the required database connection details using local environment variables or an untracked `.env` file.

Do not commit real passwords, tokens, or other secrets.

### 3. Start the backend

From the backend directory, activate your configured Python virtual environment, install the project's declared dependencies, and run:

```bash
uvicorn app.main:app --reload
```

The API is expected to be available at `http://127.0.0.1:8000` when using the default local configuration.

### 4. Start the frontend

From the frontend directory, install dependencies using the project's lockfile or package configuration, then run the development command defined in `package.json`.

Check the project's existing configuration for the correct frontend port and API URL.

### 5. Run a simulation

Use the project's scenario engine to generate synthetic telemetry, then verify the resulting detections, alerts, and related workflows in the application.

*The exact database initialization, environment variables, and frontend commands depend on the repository's current configuration.*

## Security and Testing Scope

AEGIS-SOC-GRC uses **synthetic security telemetry** to demonstrate detection and response workflows in a controlled development environment.

The scenario engine is not a real attack tool, and simulated detections should not be interpreted as evidence of activity on an actual production network.

This project is a practical demonstration and is not presented as a production-ready enterprise SIEM, SOAR, or GRC solution.

## Project Documentation

The project report provides detailed documentation of the architecture, implementation, security workflows, testing, and outcomes.

**Project report:** [View the AEGIS-SOC-GRC Project Report](docs/AEGIS-SOC-GRC%20Reports.pdf)

These links will work once the corresponding files have been added to the repository.

## Learning Outcomes

This project demonstrates practical work with:

- Security event processing and detection logic
- Alert and incident management workflows
- REST API development with FastAPI
- Frontend development using React and TypeScript
- PostgreSQL database integration
- Docker-based development environments
- Risk, compliance, and evidence-management concepts
- Security evidence integrity using SHA-256
- Documentation and project version control

## Author

**Pallabi Poria**

Cybersecurity Enthusiast | MCA Student

- LinkedIn: [Pallabi Poria](https://www.linkedin.com/in/pallabi-poria)
- GitHub: Add your GitHub profile URL here.

---




