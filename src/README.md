
# Q-SmartPay: The Future of Intelligent Payments for Amazon Pay (HackOn Season 5)

Welcome to the repository for **Q-SmartPay**, our submission for the Amazon HackOn Season 5. Q-SmartPay is a forward-thinking prototype that reimagines the Amazon Pay experience by integrating cutting-edge technologies to deliver unparalleled security, privacy, intelligence, and reliability.

Our platform is designed to seamlessly enhance the existing payment infrastructure with a suite of powerful features that protect users, offer smarter financial choices, and ensure a smooth transaction process, even when offline.

## ✨ Key Features

Q-SmartPay introduces a multi-layered approach to smart payments, built on five core pillars:

### 1. 🧠 AI-Powered Payment Suggestions
At the heart of our smart checkout is a Genkit AI flow that analyzes the user's cart value, merchant type, and available payment methods. It provides real-time, data-driven recommendations for the most beneficial payment option, complete with plausible, context-aware offers (e.g., "Save ₹250 with 5% instant discount on electronics!"). This helps users maximize savings and rewards effortlessly.
*   **Explore:** [Checkout Page](/checkout)

### 2. 🛡️ FraudGNN Shield: Advanced Fraud Detection
We've moved beyond traditional fraud detection with our Graph Neural Network (GNN) based system, **FraudGNN Shield**. It analyzes the complex relationships between users, merchants, devices, and IP addresses in real-time to identify sophisticated fraud patterns that rule-based systems would miss. The system flags high-risk transactions and provides an AI-summarized explanation of the risk factors, empowering users to make safer decisions.
*   **Explore:** [Payment Simulation Page](/payment-simulation)

### 3. 🏆 Transparent Smart Rewards on Blockchain
To build trust and provide tangible value, Q-SmartPay integrates a blockchain-based rewards system on the Polygon network. Eligible transactions are rewarded with **QSP (Q-SmartPay Points)** through a transparent, auditable, and fast smart contract. This demonstrates a decentralized approach to loyalty programs, ensuring fairness and instant gratification. In the future, these QSP tokens could be seamlessly redeemed at checkout for exclusive discounts and offers, creating a circular rewards economy.
*   **Explore:** [Smart Rewards Center](/smart-rewards)

### 4. 🔒 Privacy-Preserving Budgeting with FHE
Financial privacy is paramount. Our platform features a **Fully Homomorphic Encryption (FHE)** powered budget tracker. Users can set a budget and log transactions securely. All computations (like checking if the budget is exceeded) happen on encrypted data on the server, meaning the raw financial details are never exposed. This is a proof-of-concept for truly private financial analysis.
*   **Explore:** [FHE Privacy Page](/fhe-privacy)

### 5. 🌐 Offline Payment Resilience with DAG
Internet connectivity shouldn't be a barrier to commerce. Q-SmartPay features a robust offline payment mode. When a user is offline, payments are queued locally and cryptographically linked in a Directed Acyclic Graph (DAG) structure, ensuring data integrity. Once back online, the queue can be securely synced. The system also handles auto-cancellation of expired (48h+) offline transactions.
*   **Explore:** [Offline Payment Manager](/offline-manager)

### 6. 📊 AI Budget Insights
Our budget tracking page helps users visualize their spending habits and leverages a Genkit AI flow to provide intelligent forecasts for the upcoming month's expenditure, helping users stay on top of their finances.
*   **Explore:** [Budget Insights Page](/budget)


## 🛠️ Technology Stack

- **Frontend:** Next.js (App Router), React, TypeScript
- **UI:** ShadCN UI, Tailwind CSS, Recharts for charts
- **Generative AI:** Google AI through Genkit for flows and suggestions
- **Blockchain:** Wagmi & RainbowKit for wallet interaction, Solidity for the smart contract (on Polygon Mumbai)
- **Privacy Tech:** Mock Fully Homomorphic Encryption (FHE) for secure computation
- **Deployment:** Firebase App Hosting

## 🚀 Getting Started

Follow these instructions to get a local copy up and running.

### Prerequisites

- Node.js (v18 or later)
- npm or yarn

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

### Environment Setup

1.  Create a `.env` file in the root directory of the project.
2.  Add your Google AI API key to the `.env` file. This is required for the AI-powered features.
    ```env
    GOOGLE_API_KEY=your_google_ai_api_key
    ```
3.  Add the WalletConnect Project ID and the deployed Smart Contract address for the rewards feature.
    ```env
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
    NEXT_PUBLIC_CONTRACT_ADDR=your_polygon_mumbai_contract_address
    ```

### Running the Application

1.  **Start the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:9002`.

2.  **(Optional) Run the Genkit development UI:**
    To inspect and test the Genkit AI flows, run:
    ```bash
    npm run genkit:dev
    ```
    The Genkit UI will be available at `http://localhost:4000`.

## walkthrough

- **Homepage**: Provides an overview of all features.
- **/cart**: Add items to your cart.
- **/checkout**:
  - Click "Get AI Suggestion" to see the AI recommend the best payment method.
  - Use the network toggle in the header to simulate going offline and queue a payment.
- **/smart-rewards**: Connect a wallet on the Polygon Mumbai testnet to check for and claim rewards.
- **/payment-simulation**: See the GNN fraud detection in action with a pre-configured high-risk scenario.
- **/fhe-privacy**: Experiment with the FHE budget tracker by setting a private budget and adding transactions.
- **/offline-manager**: View and sync your queued offline payments. Use the time-travel buttons to test the auto-cancellation of expired payments.
- **/budget**: View your spending breakdown and get an AI-powered forecast for next month.
