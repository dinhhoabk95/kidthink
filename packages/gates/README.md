# @mindkid/gates

Cổng chất lượng **quét chéo repo** — rule sống ở `src/`, cưỡng chế ở `tests/`.

Cổng nào chỉ quét đường dẫn của một workspace thì ❌ NEVER đặt ở đây: nó thuộc
`tests/gates/` của workspace đó (xem `docs/tasks/103-script-surface-refactor-plan.md` §5).

Hai luật của một cổng ở đây:

1. **Quét repo thật.** Test phải gọi hàm gate với gốc `REPO_ROOT`
   (`@mindkid/config/paths`) và assert 0 vi phạm — không chỉ đưa chuỗi fixture vào.
2. **Có ca âm** (`BR-TYP-07`). Một mẫu vi phạm phải làm test đỏ. Fixture ở
   `tests/fixtures/`.

Package này **đọc file** trong `apps/*` bằng `fs`, ❌ NEVER `import` từ `apps/*` —
`BR-MPA-06` nói về cạnh phụ thuộc, và `pnpm lint:deps` cưỡng chế nó.
