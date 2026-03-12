import { useEffect, useState } from "react";

import { createTag, deleteTag, listTags, type Tag } from "../../api/tags";
import "../../components/layout/AdminLayout.css";

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setTags(await listTags());
    } catch (err) {
      setError((err as Error)?.message ?? "Failed to load tags.");
      setTags([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await createTag(name.trim());
      setName("");
      await load();
    } catch (err) {
      setError((err as Error)?.message ?? "Failed to create tag.");
    }
  }

  async function handleDelete(tagId: string) {
    try {
      await deleteTag(tagId);
      await load();
    } catch (err) {
      setError((err as Error)?.message ?? "Failed to delete tag.");
    }
  }

  return (
    <div className="adm-page">
      <div className="adm-page__top">
        <div>
          <h1 className="adm-page__title">Tags</h1>
          <p className="adm-page__sub">Manage task tags used across the system.</p>
        </div>
      </div>

      <div className="adm-card adm-section">
        <form onSubmit={handleCreate} className="adm-form-grid">
          <div className="adm-form-group">
            <label>New Tag</label>
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter tag name" required />
          </div>
          <div className="adm-form-group">
            <label>&nbsp;</label>
            <button type="submit" className="adm-btn-primary">
              Create Tag
            </button>
          </div>
        </form>

        {error && <div className="adm-form-error">{error}</div>}
      </div>

      <div className="adm-card adm-tablewrap">
        {loading ? (
          <div>Loading tags...</div>
        ) : (
          <table className="adm-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tags.map((tag) => (
                <tr key={tag.id}>
                  <td>{tag.name}</td>
                  <td>
                    <button className="adm-btn adm-btn--danger" onClick={() => void handleDelete(tag.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {tags.length === 0 && (
                <tr>
                  <td colSpan={2}>No tags found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
