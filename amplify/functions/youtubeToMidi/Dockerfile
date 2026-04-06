FROM public.ecr.aws/lambda/python:3.11

RUN python - <<'PY'
import os
import shutil
import stat
import tarfile
import urllib.request
from pathlib import Path

archive_path = Path('/tmp/ffmpeg-release-amd64-static.tar.xz')
extract_root = Path('/tmp/ffmpeg-static')
url = 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz'

urllib.request.urlretrieve(url, archive_path)
extract_root.mkdir(parents=True, exist_ok=True)

with tarfile.open(archive_path, 'r:xz') as archive:
    archive.extractall(extract_root)

extracted_dir = next(path for path in extract_root.iterdir() if path.is_dir())
for binary_name in ('ffmpeg', 'ffprobe'):
    source_path = extracted_dir / binary_name
    target_path = Path('/usr/local/bin') / binary_name
    shutil.copy2(source_path, target_path)
    target_path.chmod(target_path.stat().st_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)
PY

RUN if command -v yum >/dev/null 2>&1; then \
        yum install -y gcc gcc-c++ make cmake && yum clean all; \
    elif command -v dnf >/dev/null 2>&1; then \
        dnf install -y gcc gcc-c++ make cmake && dnf clean all; \
    elif command -v microdnf >/dev/null 2>&1; then \
        microdnf install -y gcc gcc-c++ make cmake && microdnf clean all; \
    else \
        echo 'No supported package manager found for Lambda build tools.' && exit 1; \
    fi

COPY requirements.txt ./requirements.txt
RUN python -m pip install --upgrade pip && \
    python -m pip install --no-cache-dir -r requirements.txt --target ${LAMBDA_TASK_ROOT} && \
    python -m pip install --no-cache-dir basic-pitch==0.4.0 --no-deps --target ${LAMBDA_TASK_ROOT}

COPY handler.py ${LAMBDA_TASK_ROOT}/handler.py

CMD ["handler.lambda_handler"]
