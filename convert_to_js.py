# -*- coding: utf-8 -*-
"""
将 hubs.json 转换为 web/js/data.js 格式
"""

import json
import os

def convert_to_js():
    # 读取 JSON
    json_path = os.path.join(os.path.dirname(__file__), 'data', 'logistics_hubs', 'hubs.json')
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # 生成 JS 文件
    js_path = os.path.join(os.path.dirname(__file__), 'web', 'js', 'data.js')

    with open(js_path, 'w', encoding='utf-8') as f:
        f.write('// 国家物流枢纽数据\n')
        f.write('// 此文件由 convert_to_js.py 从 hubs.json 生成\n\n')
        f.write('window.LOGISTICS_HUBS_DATA = ')
        f.write(json.dumps(data, ensure_ascii=False, indent=2))
        f.write(';\n')

    print(f"Generated: {js_path}")
    print(f"Total hubs: {data['count']}")

if __name__ == "__main__":
    convert_to_js()
