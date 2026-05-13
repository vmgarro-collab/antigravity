import json
import re
import hashlib
from datetime import datetime
from pathlib import Path


def _extract_tasks_from_md(filepath: Path) -> list:
    try:
        text = filepath.read_text(encoding='utf-8', errors='ignore')
    except Exception:
        return []

    title_match = re.search(r'^#\s+(.+)$', text, re.MULTILINE)
    title = title_match.group(1).strip() if title_match else filepath.stem

    tasks = []
    in_task_section = False
    header_passed = False

    for line in text.split('\n'):
        if re.match(r'^##\s+Tareas', line, re.IGNORECASE):
            in_task_section = True
            header_passed = False
            continue
        if in_task_section:
            if re.match(r'^\s*\|[-| ]+\|\s*$', line):
                header_passed = True
                continue
            if line.strip().startswith('|') and header_passed:
                cols = [c.strip() for c in line.strip().strip('|').split('|')]
                if len(cols) < 2:
                    continue
                # cols: [#, Tarea, Responsable, Fecha]
                task_text = cols[1] if len(cols) > 1 else cols[0]
                responsible = cols[2] if len(cols) > 2 else ''
                deadline = cols[3] if len(cols) > 3 else ''
                if not task_text or task_text.lower() in ('tarea', 'task', ''):
                    continue
                task_id = hashlib.md5(f"{filepath.name}:{task_text}".encode()).hexdigest()[:12]
                tasks.append({
                    'id': task_id,
                    'text': task_text,
                    'responsible': responsible,
                    'deadline': deadline,
                    'source_file': filepath.name,
                    'source_title': title,
                    'done': False,
                    'done_at': None,
                })
            elif line.strip().startswith('#') and in_task_section and header_passed:
                break

    return tasks


def sync_tasks(minutas_dir: Path) -> list:
    tasks_file = minutas_dir / 'tasks.json'

    existing = {}
    if tasks_file.exists():
        try:
            for t in json.loads(tasks_file.read_text(encoding='utf-8')):
                existing[t['id']] = t
        except Exception:
            pass

    all_tasks = {}
    for md_file in sorted(minutas_dir.glob('minuta_*.md'), reverse=True)[:60]:
        for task in _extract_tasks_from_md(md_file):
            tid = task['id']
            if tid in existing:
                task['done'] = existing[tid].get('done', False)
                task['done_at'] = existing[tid].get('done_at')
            all_tasks[tid] = task

    # Keep manually persisted tasks not in any current file
    for tid, t in existing.items():
        if tid not in all_tasks:
            all_tasks[tid] = t

    result = sorted(all_tasks.values(), key=lambda x: (x['done'], x['source_file']))
    tasks_file.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    return result


def update_task(minutas_dir: Path, task_id: str, done: bool) -> dict:
    tasks_file = minutas_dir / 'tasks.json'
    if not tasks_file.exists():
        return {}
    tasks = json.loads(tasks_file.read_text(encoding='utf-8'))
    for t in tasks:
        if t['id'] == task_id:
            t['done'] = done
            t['done_at'] = datetime.now().isoformat() if done else None
            break
    tasks_file.write_text(json.dumps(tasks, ensure_ascii=False, indent=2), encoding='utf-8')
    return next((t for t in tasks if t['id'] == task_id), {})
