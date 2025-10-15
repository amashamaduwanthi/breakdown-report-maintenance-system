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
                    <h2>Reporter App</h2>
                    <p>
                        Employees submit breakdowns, monitor live status updates, and review fix history in real
                        time.
                    </p>
                    <Link className="landing__link" to="/reporter">
                        Launch Reporter App
                    </Link>
                </article>
            </section>

            <footer className="landing__footer">
                Shared Firebase backend · Real-time synchronization · Secure role-based access
            </footer>
        </div>
    );
}
