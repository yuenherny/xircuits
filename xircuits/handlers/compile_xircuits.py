import json

import tornado
from jupyter_server.base.handlers import APIHandler

from pathlib import Path

from xircuits.compiler import compile


class CompileXircuitsFileRouteHandler(APIHandler):
    def __get_notebook_absolute_path__(self, path):
        return (Path(self.application.settings['server_root_dir']) / path).expanduser().resolve()

    @tornado.web.authenticated
    def get(self):
        self.finish(json.dumps({"data": "This is file/compile endpoint!"}))

    @tornado.web.authenticated
    def post(self):
        input_data = self.get_json_body()

        input_file_path = input_data["filePath"]
        output_file_path = input_data["outPath"]

        component_python_paths = input_data["pythonPaths"]

        with open(self.__get_notebook_absolute_path__(input_file_path), 'r') as infile:
            with open(self.__get_notebook_absolute_path__(output_file_path), 'w') as outfile:
                compile(infile, outfile, component_python_paths)

        data = {"message": "completed"}

        self.finish(json.dumps(data))