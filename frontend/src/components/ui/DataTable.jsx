import { EmptyState } from "./Feedback";

/**
 * columns: [{ key, header, render?: (row) => node }]
 * rows: array of data, each needs a stable `rowKey` accessor
 */
export default function DataTable({ columns, rows, rowKey, emptyIcon, emptyTitle, emptyHint }) {
  if (!rows || rows.length === 0) {
    return <EmptyState icon={emptyIcon} title={emptyTitle} hint={emptyHint} />;
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((c) => (
                <td key={c.key}>{c.render ? c.render(row) : row[c.key] ?? <span className="table-cell--muted">—</span>}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
