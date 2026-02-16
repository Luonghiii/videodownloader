from flask import Flask, request, jsonify
from flask_cors import CORS
import yt_dlp

app = Flask(__name__)
CORS(app)

@app.route('/api/info', methods=['POST'])
def get_info():
    data = request.get_json()
    url = data.get('url')

    if not url:
        return jsonify({'error': 'URL is required'}), 400

    try:
        ydl_opts = {
            'quiet': True,
            'skip_download': True,
            'extract_flat': True,
            'cache_dir': '/tmp/',
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            return jsonify({
                'title': info.get('title'),
                'thumbnail': info.get('thumbnail'),
                'platform': info.get('extractor_key'),
                'uploader': info.get('uploader'),
                'duration': info.get('duration_string')
            })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/resolve', methods=['POST'])
def resolve_url():
    data = request.get_json()
    url = data.get('url')

    if not url:
        return jsonify({'error': 'URL is required'}), 400

    try:
        ydl_opts = {
            'quiet': True,
            'format': 'best', # Get best single file
            'noplaylist': True,
            'cache_dir': '/tmp/',
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            # Find the best url
            download_url = info.get('url')
            # For some sites, formats might be needed
            if not download_url and 'formats' in info:
                 # Simple logic: pick the last format (often best quality) or first
                 # Better logic: filter for mp4/video
                 formats = [f for f in info['formats'] if f.get('ext') == 'mp4']
                 if formats:
                     download_url = formats[-1].get('url')
                 else:
                     download_url = info['formats'][-1].get('url')

            return jsonify({
                'url': download_url,
                'title': info.get('title'),
                'ext': info.get('ext', 'mp4')
            })
    except Exception as e:
         return jsonify({'error': str(e)}), 500

import requests

@app.route('/api/proxy')
def proxy_download():
    url = request.args.get('url')
    filename = request.args.get('filename', 'video.mp4')
    
    if not url:
        return "URL is required", 400

    try:
        # Stream the content
        req = requests.get(url, stream=True)
        
        # Generator to stream content
        def generate():
            for chunk in req.iter_content(chunk_size=4096):
                yield chunk

        return app.response_class(generate(), headers={
            'Content-Disposition': f'attachment; filename="{filename}"',
            'Content-Type': req.headers.get('Content-Type', 'video/mp4'),
            'Content-Length': req.headers.get('Content-Length')
        })

    except Exception as e:
        return str(e), 500

# For local testing
if __name__ == '__main__':
    app.run(port=5000)
