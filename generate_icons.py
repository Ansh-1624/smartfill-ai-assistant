import zlib
import struct
import math
import os

def create_png(width, height, rgba_data):
    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)

    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)  # filter type 0 (None)
        row_offset = y * width * 4
        raw_data.extend(rgba_data[row_offset:row_offset + width * 4])

    compressed = zlib.compress(bytes(raw_data), 9)

    png = bytearray(b'\x89PNG\r\n\x1a\n')
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    png.extend(chunk(b'IHDR', ihdr_data))
    png.extend(chunk(b'IDAT', compressed))
    png.extend(chunk(b'IEND', b''))
    return bytes(png)

def render_smartfill_icon(size):
    rgba = bytearray(size * size * 4)
    cx, cy = size / 2.0, size / 2.0
    corner_r = size * 0.22

    for y in range(size):
        for x in range(size):
            idx = (y * size + x) * 4
            dx = abs(x - cx)
            dy = abs(y - cy)
            
            # Rounded rect distance
            qx = max(0.0, dx - (cx - corner_r))
            qy = max(0.0, dy - (cy - corner_r))
            dist = math.sqrt(qx * qx + qy * qy)
            
            if dist <= corner_r:
                alpha = min(1.0, max(0.0, corner_r - dist + 0.8))
                norm_y = y / float(size)
                norm_x = x / float(size)
                
                # Deep Electric Cyan to Vibrant Violet/Indigo
                r = int((20 + norm_x * 70 + norm_y * 110))
                g = int((130 + (1 - norm_y) * 115 - norm_x * 50))
                b = int((245 + (1 - norm_x) * 10))
                
                # 3D Glossy specular highlight on upper third
                if norm_y < 0.35 and dist < corner_r - 1:
                    gloss = (0.35 - norm_y) / 0.35 * 70
                    r = min(255, int(r + gloss))
                    g = min(255, int(g + gloss))
                    b = min(255, int(b + gloss))

                # Spark/Lightning geometric shape in center
                nx = (x - cx) / (size * 0.36)
                ny = (y - cy) / (size * 0.36)
                
                in_bolt = False
                if -1.0 <= ny <= 1.0 and -1.0 <= nx <= 1.0:
                    if -0.8 <= ny <= -0.05 and (-0.7 - ny*0.7) <= nx <= (0.3 - ny*0.6):
                        in_bolt = True
                    elif -0.2 <= ny <= 0.2 and -0.6 <= nx <= 0.6:
                        in_bolt = True
                    elif 0.05 <= ny <= 0.8 and (-0.3 - ny*0.6) <= nx <= (0.7 - ny*0.7):
                        in_bolt = True
                
                if in_bolt:
                    r = 255
                    g = 255
                    b = 255
                
                rgba[idx] = max(0, min(255, r))
                rgba[idx + 1] = max(0, min(255, g))
                rgba[idx + 2] = max(0, min(255, b))
                rgba[idx + 3] = int(alpha * 255)
            else:
                rgba[idx] = 0
                rgba[idx + 1] = 0
                rgba[idx + 2] = 0
                rgba[idx + 3] = 0
                
    return create_png(size, size, rgba)

out_dir = os.path.join(os.path.dirname(__file__), 'icons')
os.makedirs(out_dir, exist_ok=True)
for s in [16, 32, 48, 128]:
    png_bytes = render_smartfill_icon(s)
    path = os.path.join(out_dir, f'icon-{s}.png')
    with open(path, 'wb') as f:
        f.write(png_bytes)
    print(f"Generated {path} ({len(png_bytes)} bytes)")
