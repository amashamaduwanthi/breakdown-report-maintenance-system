import { Link } from "react-router-dom";
import "./App.css";

export default function App() {
    return (
        <div className="landing">
            <header className="landing__header">
                <h1>Real-time Breakdown Reporting System</h1>
                <p>
                    Two synchronized web apps powered by Firebase Realtime Database and Authentication.
                </p>
            </header>

            <section className="landing__grid">
                <article className="landing__card">
                    <h2>Manager App</h2>
                    <p>
                        Managers and technicians triage new incidents, assign work, track progress, and close
                        fixes collaboratively.
                    </p>
                    <Link className="landing__link" to="/manager">
                        Launch Manager App
                    </Link>
                </article>
            </section>

            <footer className="landing__footer">
                © 2025 BreakDownManagement. All rights reserved
            </footer>
        </div>
    );
}
