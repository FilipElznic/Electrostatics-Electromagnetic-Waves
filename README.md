# Electromagnetism Sandbox ⚛️

**Electromagnetism Sandbox** is an interactive educational platform designed to make invisible physical forces visible and intuitive. It bridges the gap between abstract physics equations and tangible experience through real-time simulations and gamified learning.

![Project Preview](public/preview.png)

## 🚀 Features

The application features three distinct simulation modes, each focusing on a different aspect of physics:

### 1. Electrostatics Lab ⚡

A free-form sandbox where users can experiment with electric charges.

- **Core Concept**: Coulomb's Law & Electric Fields.
- **Math**:
  - Calculates the net force on every particle using the **Superposition Principle**.
  - **Coulomb's Law**: $F = k_e \frac{q_1 q_2}{r^2}$ determines the attraction/repulsion between charges.
  - **Electric Field Visualization**: Computes the electric field vector $\vec{E}$ at grid points to render field lines and vector maps.

### 2. Signal Bouncer (Waves) 📡

A puzzle game where players guide a Wi-Fi signal to a target using mirrors.

- **Core Concept**: Ray Optics & Reflection.
- **Math**:
  - **Ray Tracing**: Simulates the path of light/radio waves as rays.
  - **Vector Reflection**: Calculates the bounce angle using the surface normal: $\vec{R} = \vec{D} - 2(\vec{D} \cdot \vec{N})\vec{N}$.
  - **Intersection Testing**: Uses line-segment intersection algorithms to detect collisions with walls and mirrors.

### 3. Polarity Parkour 🧲

An arcade platformer where the player controls a charged particle.

- **Core Concept**: Dynamics & Magnetic Forces.
- **Math**:
  - **Newtonian Physics**: Implements gravity ($F=mg$), velocity, and acceleration using **Euler Integration**.
  - **Electromagnetic Forces**: The player's movement is influenced by magnetic fields using an adapted inverse-square law ($F \propto \frac{1}{r^2}$).
  - **Dynamic Polarity**: Switching polarity instantly inverts the force vectors (Attraction $\leftrightarrow$ Repulsion).

## 🛠️ Tech Stack

- **Frontend Framework**: [React](https://react.dev/) (v18)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Custom "Organic Modern" design system.
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: JavaScript (ES6+)
- **Rendering**: HTML5 Canvas API (2D Context)

## 📦 Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/FilipElznic/Electrostatics-Electromagnetic-Waves.git
   cd Electrostatics-Electromagnetic-Waves
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Run the development server**

   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## 🎨 Design Philosophy

The project moved away from a traditional "Sci-Fi/Hacker" aesthetic to a **"Human-Centric"** design.

- **Palette**: Warm Zinc backgrounds with friendly Indigo and Rose accents.
- **Typography**: Clean sans-serif fonts for better readability.
- **UI**: Soft, rounded geometry (Pill shapes, Bento grids) to make physics feel accessible and safe, not intimidating.

---

_Created by Filip Elznic_
