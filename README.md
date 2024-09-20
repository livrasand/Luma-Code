# <img src="https://github.com/user-attachments/assets/77de282c-2276-4a93-9db1-abaa3de2ceb9" width="30"> **[Luma Code - The First Self-Programming AI Code Editor]()**

![Captura de pantalla (461)](https://github.com/user-attachments/assets/f29202d6-a643-4521-b489-58910feda728)

### The future of code editing, powered by AI & well-being 

---

Welcome to Luma Code, where intelligence and ergonomics meet for a new era of code editing. Whether you're a seasoned developer or just starting, Luma Code provides an environment that enhances your creativity, productivity, and well-being.

---

## **Features**

### **Smart Integration with ChatGPT**
Interact with ChatGPT directly from the editor, getting contextual suggestions, corrections, and even AI-generated code blocks in real-time.

- Interact directly with AI to generate code, debug, and optimize on the go.
- Smart templates to kickstart projects.
- Context-aware suggestions as you type.

### **Smart multi-language support**
Luma Code detects the programming language automatically, providing the best possible experience in Python, JavaScript, HTML, CSS, and many more.

- **Advanced auto-completion**: AI predicts what you need as you type.
- **Automatic correction** of syntax errors in real-time.

---

## **Eye Comfort First: An Interface Designed for Your Health - The code has never looked so good**

### **Visual ergonomics**
Our interface and color schemes have been **designed and approved by eye health specialists**. Every element on screen is optimized to give you maximum visual comfort during long work sessions.

- **Smart removal modes**: The editor automatically adjusts colors and lighting based on the time of day, to reduce eye strain.
- **Active break alerts**: Luma Code gently reminds you to take periodic breaks to take care of your health.

### **Ergonomic Break Assistant**
Not only does it remind you to take breaks, it also suggests **ergonomic exercises** based on your usage habits, improving your posture and well-being.

---

## 🎧 **Scheduling never sounded so good**

### **Integration with your favorite music service**
Luma Code lets you **sync your Spotify, Apple Music, or YouTube account** so you can enjoy the music that helps you focus, right from the editor.

- **Smart keyboard shortcuts** to pause, play, and change songs without interrupting your workflow.
- **Productivity modes** with timers and tailored music to improve your focus.

### **Pomodoro with music**
Boost productivity with the Pomodoro technique, complemented by AI-recommended music tailored to your focus and mood.

- AI can even **recommend music based on your emotional state** or work pace, detected through your interaction with the code.

---

## **Integration with GitHub, Git, and more**
Luma Code lets you integrate your repositories and manage the entire development cycle without leaving the editor:

- **Upload, clone, and manage your Git projects** with ease.
- Real-time code review, diff visualization, and smart commit, all in one place.

---

## 🤝 **How ​​to contribute**

Love Luma Code and want to help make it even better? We're open to your creativity! Here are some steps to help:

1. **Clone the repository**
2. **Install the dependencies**
3. **Start Luma Code**
4. **Share your magic**

## 🚧 **Luma Code: The beginning of something big**

**Luma Code** was born on September 15, 2024, as an ambitious emerging project that is taking shape, step by step. Although we are still a small jump away from making it the most incredible editor you have ever seen, we are focusing on what really matters: **functionalities**. So, yes... **Luma is not the most attractive yet**, but it is full of potential!

### **Help us make it happen**
We want **Luma Code** to be more than a code editor, we want it to be an experience. And to achieve this, we need **your skills and creativity**:

- **Graphic designers**: If you see beauty where others only see lines, **we need you**. Help us bring the Luma interface to life and make coding look as good as it feels.

- **Programmers**: If you love code as much as we do, join us to optimize and expand Luma Code's functionality. We're building something that will transform how we work with code.

- **Testers and early adopters**: Your feedback is our roadmap. Test, explore, break (gently), and **evaluate** Luma Code so we can improve it with every iteration.

---

### 🔥 **This is just the beginning**
Luma Code is on its way, and you can be part of its **transformation**. It's not just about improving a code editor, it's about bringing to life a tool that will change the way we interact with code. Help us make it **better and more beautiful**!

### ⭐ Stay Updated!

We’re just getting started, and your support can take Luma Code to the next level! Star, Watch, and Fork the repository to follow our progress and join this exciting journey.

---

If you want to be part of the future of **Luma Code**, give the repository a "Star", **Fork** and let's make magic together.


# Running Luma Code Locally

To get started with **Luma Code** on your local machine, follow these steps:

## 1. Clone the Repository

First, clone the Luma Code repository from GitHub:

```bash
git clone https://github.com/your-username/luma-code.git
cd luma-code
```

## 2. Install Node.js Dependencies

Navigate to the project directory and install the required Node.js dependencies:

```bash
npm install
npm install --save-dev electron
```

## 3. Install Python Dependencies

Make sure you have Python and `pip` installed. Then, install the Python dependencies using:

```bash
cd backend
pip install -r requirements.txt
```

## 4. Configure Environment Variables

Create a `.env` file in the `backend` directory with your OpenAI API key. The file should look like this:

```
OPENAI_API_KEY=your_openai_api_key_here
```

## 5. Start the Flask Server

In a terminal, navigate to the `backend` directory and start the Flask server:

```bash
cd backend
python app.py
```

## 6. Start the Electron Application

Open another terminal window, navigate back to the root of your project directory, and start the Electron application:

```bash
npm start
```

If have a problems, start with this:

```bash
npx electron frontend/main.js
```

## 7. Enjoy Luma Code!

Once the app launches, start coding, ask ChatGPT, and make your workflow smoother.
