import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card">
      <div className="empty">
        <h2>No such brief</h2>
        <p className="muted">It may have been deleted.</p>
        <Link className="btn btn-secondary" href="/">Back to the queue</Link>
      </div>
    </div>
  );
}
