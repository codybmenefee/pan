# Use OSGEO's GDAL image - has GDAL/GEOS/PROJ pre-installed (Ubuntu 22.04 base)
FROM ghcr.io/osgeo/gdal:ubuntu-small-3.8.5

# Install Python 3 (uses system python3.10 from Ubuntu 22.04)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-venv \
    python3-pip \
    && rm -rf /var/lib/apt/lists/* \
    && ln -sf /usr/bin/python3 /usr/bin/python

WORKDIR /app

# Copy and install Python dependencies (layer cached if requirements unchanged)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code (changes frequently, so last)
COPY . .

EXPOSE 8080

CMD ["python", "scheduler.py", "--loop"]
