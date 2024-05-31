#!/usr/bin/env node

import * as ts from 'typescript';

import node_path from 'node:path';
import node_fs from 'node:fs';

import { program } from 'commander';

class File_Manager {
  constructor(private _folder: string) {}

  to_file(file_name: string, content: string) {
    const path = node_path.join(this._folder, file_name);
    node_fs.writeFileSync(path, content);
    return path;
  }

  exist(file_name: string) {
    const path = node_path.join(this._folder, file_name);
    return Boolean(node_fs.existsSync(path));
  }

  async exist_folder_cq() {
    const path = node_path.join(this._folder);
    return new Promise((resolve) => {
      node_fs.stat(path, function (err) {
        return err ? resolve(false) : resolve(true);
      });
    });
  }

  create_folder_cq() {
    node_fs.mkdirSync(this._folder);
  }

  exist_index(index_for_cq) {
    const path = node_path.join(this._folder, '../', index_for_cq);
    return Boolean(node_fs.existsSync(path));
  }
}

class Format_Name {
  constructor(private _is_camel_case: boolean) {}

  capitalized_first_word(word: string) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  lower_case_first_word(word: string) {
    return word.charAt(0).toLowerCase() + word.slice(1);
  }

  create_action_name(word: string) {
    return !this._is_camel_case ? this.lower_case_first_word(word).toLowerCase() : this.lower_case_first_word(word);
  }

  create_command_name(command: string) {
    return !this._is_camel_case ? `${command}_Command` : `${command}Command`;
  }

  create_interface_command_or_query_name(name: string) {
    return !this._is_camel_case ? 'I_' + name : `I${name}`;
  }

  create_query_name(query: string) {
    return !this._is_camel_case ? `${query}_Query` : `${query}Query`;
  }

  create_class_handler_name(query: string) {
    return !this._is_camel_case ? `${query}_Handler` : `${query}Handler`;
  }

  create_tag(command_or_query_name) {
    return this._is_camel_case
      ? this.camel_case_to_kebab_case(command_or_query_name)
      : this.snake_case_to_kebab_case(command_or_query_name);
  }

  private camel_case_to_kebab_case(str: string) {
    return this.lower_case_first_word(str).replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
  }

  private snake_case_to_kebab_case(str: string) {
    return str.replace(/_/g, '-');
  }
}

async function main({
  is_camel_case,
  module_path,
  folder_cq,
  index_for_cq,
  index_type_for_cq,
  action,
}: {
  is_camel_case: boolean;
  module_path: string;
  folder_cq: string;
  index_for_cq: string;
  index_type_for_cq: string;
  action: { name: string; type: 'command' | 'query' };
}) {
  const file_manager = new File_Manager(node_path.join(module_path, folder_cq));
  if (!(await file_manager.exist_folder_cq())) {
    file_manager.create_folder_cq();
  }

  const format_name = new Format_Name(is_camel_case);
  const capitalized_action_name = format_name.capitalized_first_word(action.name);
  const file_name = action.type === 'command' ? capitalized_action_name + '.command.ts' : capitalized_action_name + '.query.ts';

  if (action.type === 'command' && !file_manager.exist(file_name)) {
    const {
      tag,
      class_command_name,
      file_name: command_file_name,
    } = create_command(capitalized_action_name, format_name, module_path, file_manager, file_name);
    const handler = create_handler(
      format_name,
      capitalized_action_name,
      { class_name: class_command_name, type: action.type },
      command_file_name,
      tag,
      file_manager,
    );

    const path_index_file = node_path.join(module_path, index_for_cq);
    const path_index_type_file = node_path.join(module_path, index_type_for_cq);
    if (handler) {
      const index_file_was_created = create_index_file(
        file_manager,
        format_name,
        capitalized_action_name,
        folder_cq,
        class_command_name,
        command_file_name,
        handler.class_handler_name,
        handler.handler_file_name,
        module_path,
        index_for_cq,
      );
      if (!index_file_was_created) {
        append_to_index_file({
          format_name,
          folder_cq,
          path_index_file,
          capitalized_action_name,
          class_action_name: class_command_name,
          action_file_name: command_file_name,
          class_handler_name: handler.class_handler_name,
          handler_file_name: handler.handler_file_name,
        });
      }

      const index_type_file_was_created = create_index_type_file(
        file_manager,
        format_name,
        capitalized_action_name,
        folder_cq,
        command_file_name,
        handler.handler_file_name,
        module_path,
        index_type_for_cq,
      );
      if (!index_type_file_was_created) {
        append_to_index_type_file({
          format_name,
          folder_cq,
          path_index_type_file,
          capitalized_action_name,
          action_file_name: command_file_name,
          handler_file_name: handler.handler_file_name,
        });
      }
    }
  }

  if (action.type === 'query' && !file_manager.exist(file_name)) {
    const {
      tag,
      class_query_name,
      file_name: query_file_name,
    } = create_query(capitalized_action_name, format_name, module_path, file_manager, file_name);
    const handler = create_handler(
      format_name,
      capitalized_action_name,
      { class_name: class_query_name, type: action.type },
      query_file_name,
      tag,
      file_manager,
    );

    const path_index_file = node_path.join(module_path, index_for_cq);
    const path_index_type_file = node_path.join(module_path, index_type_for_cq);
    if (handler) {
      const index_file_was_created = create_index_file(
        file_manager,
        format_name,
        action.name,
        folder_cq,
        class_query_name,
        query_file_name,
        handler.class_handler_name,
        handler.handler_file_name,
        module_path,
        index_for_cq,
      );
      if (!index_file_was_created) {
        append_to_index_file({
          format_name,
          folder_cq,
          path_index_file,
          capitalized_action_name,
          action_file_name: query_file_name,
          class_action_name: class_query_name,
          class_handler_name: handler.class_handler_name,
          handler_file_name: handler.handler_file_name,
        });
      }
      const index_type_file_was_created = create_index_type_file(
        file_manager,
        format_name,
        capitalized_action_name,
        folder_cq,
        query_file_name,
        handler.handler_file_name,
        module_path,
        index_type_for_cq,
      );
      if (!index_type_file_was_created) {
        append_to_index_type_file({
          format_name,
          folder_cq,
          path_index_type_file,
          capitalized_action_name,
          action_file_name: query_file_name,
          handler_file_name: handler.handler_file_name,
        });
      }
    }
  }
  // process.exit(1);
}
// create_export_type_declaration('GetByIdQuery')
function create_export_type_declaration(module_path: string) {
  // export type * from './cq/GetById.query'
  const export_declaration = ts.factory.createExportDeclaration(undefined, true, undefined, ts.factory.createStringLiteral(module_path));

  // const source_file = ts.createSourceFile(
  //   'file.ts',
  //   '',
  //   ts.ScriptTarget.Latest,
  //   /* setParentNodes */ true
  // );
  // const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  // const content = printer.printNode(ts.EmitHint.Unspecified, export_declaration, source_file);
  // console.log(content);
  return export_declaration;
}

function create_import_declaration(module_path: string, import_name: string): ts.ImportDeclaration {
  const import_clause = ts.factory.createImportClause(
    false,
    /* name */ undefined,
    ts.factory.createNamedImports([
      ts.factory.createImportSpecifier(false, /* propertyName */ undefined, ts.factory.createIdentifier(import_name)),
    ]),
  );

  const import_from = ts.factory.createStringLiteral(module_path);

  const import_declaration = ts.factory.createImportDeclaration(
    // /* decorators */ undefined,
    /* modifiers */ undefined,
    import_clause,
    import_from,
  );

  return import_declaration;
}

function create_export_declaration_of_action({
  action_name,
  class_action_name,
  class_handler_name,
}: {
  action_name: string;
  class_action_name: string;
  class_handler_name: string;
}) {
  //  { action, handler }
  const object_node = ts.factory.createObjectLiteralExpression([
    ts.factory.createPropertyAssignment('action', ts.factory.createIdentifier(class_action_name)),
    ts.factory.createPropertyAssignment('handler', ts.factory.createIdentifier(class_handler_name)),
  ]);

  // actionName = { action, handler };
  // Create a TypeScript AST node for the 'const' declaration
  const toBookDeclaration = ts.factory.createVariableDeclaration(action_name, undefined, undefined, object_node);

  // export const actionName = { action, handler };
  // Create a TypeScript AST node for the 'const' declaration statement
  const export_statement = ts.factory.createVariableStatement(
    ts.factory.createModifiersFromModifierFlags(ts.ModifierFlags.Export),
    ts.factory.createVariableDeclarationList([toBookDeclaration], ts.NodeFlags.Const),
  );

  return export_statement;
}

function append_to_index_file({
  folder_cq,
  format_name,
  path_index_file,
  capitalized_action_name,
  action_file_name,
  class_action_name,
  class_handler_name,
  handler_file_name,
}: {
  format_name: Format_Name;
  folder_cq: string;
  path_index_file: string;
  capitalized_action_name: string;
  action_file_name: string;
  class_action_name: string;
  class_handler_name: string;
  handler_file_name: string;
}) {
  // Parse the source file
  const source_file = ts.createSourceFile(
    'file.ts',
    node_fs.readFileSync(path_index_file, 'utf-8'),
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
  );

  const path_action_file_name = '.' + node_path.join(folder_cq, action_file_name).replace(/\.ts$/, '');
  const import_declaration_action = create_import_declaration(path_action_file_name, class_action_name);
  const path_handler_file_name = '.' + node_path.join(folder_cq, handler_file_name).replace(/\.ts$/, '');
  const import_declaration_handler = create_import_declaration(path_handler_file_name, class_handler_name);

  const export_statement = create_export_declaration_of_action({
    action_name: format_name.create_action_name(capitalized_action_name),
    class_action_name,
    class_handler_name,
  });

  const new_statements = [...[import_declaration_action, import_declaration_handler], ...source_file.statements, export_statement];

  const updated_source_file = ts.factory.updateSourceFile(source_file, new_statements);

  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  const content = printer.printFile(updated_source_file);

  const path = new File_Manager(path_index_file).to_file('', content);

  console.log(`[SUCCESS]: Export of action ${format_name.create_action_name(capitalized_action_name)} was added to ${path}`);
}

function append_to_index_type_file({
  format_name,
  folder_cq,
  path_index_type_file,
  capitalized_action_name,
  action_file_name,
  handler_file_name,
}: {
  format_name: Format_Name;
  folder_cq: string;
  path_index_type_file: string;
  capitalized_action_name: string;
  action_file_name: string;
  handler_file_name: string;
}) {
  // Parse the source file
  const source_file = ts.createSourceFile(
    'file.ts',
    node_fs.readFileSync(path_index_type_file, 'utf-8'),
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
  );

  const path_action_file_name = '.' + node_path.join(folder_cq, action_file_name).replace(/\.ts$/, '');
  const export_type_action_statement = create_export_type_declaration(path_action_file_name);
  const path_handler_file_name = '.' + node_path.join(folder_cq, handler_file_name).replace(/\.ts$/, '');
  const export_type_handler_statement = create_export_type_declaration(path_handler_file_name);

  const new_statements = [...source_file.statements, export_type_action_statement, export_type_handler_statement];

  const updated_source_file = ts.factory.updateSourceFile(source_file, new_statements);

  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  const content = printer.printFile(updated_source_file);

  const path = new File_Manager(path_index_type_file).to_file('', content);

  console.log(`[SUCCESS]: Export types of action ${format_name.create_action_name(capitalized_action_name)} were added to ${path}`);
}

function create_index_file(
  file_manager: File_Manager,
  format_name: Format_Name,
  capitalized_action_name: string,
  folder_cq: string,
  class_action_name: string,
  action_file_name: string,
  class_handler_name: string,
  handler_file_name: string,
  module_path: string,
  index_for_cq: string,
) {
  if (file_manager.exist_index(index_for_cq)) {
    return false;
  }
  const content =
    `import { ${class_action_name} } from '.${node_path.join(folder_cq, action_file_name).replace(/\.ts$/, '')}';\n` +
    `import { ${class_handler_name} } from '.${node_path.join(folder_cq, handler_file_name).replace(/\.ts$/, '')}';\n\n` +
    `export const ${format_name.create_action_name(capitalized_action_name)} = {\n` +
    `  action: ${class_action_name},\n` +
    `  handler: ${class_handler_name},\n` +
    '};\n\n';

  const path = new File_Manager(module_path).to_file(index_for_cq, content);
  console.log(`[SUCCESS]: Export of action ${format_name.create_action_name(capitalized_action_name)} was added in ${path}`);
  return true;
}

function create_index_type_file(
  file_manager: File_Manager,
  format_name: Format_Name,
  capitalized_action_name: string,
  folder_cq: string,
  action_file_name: string,
  handler_file_name: string,
  module_path: string,
  index_type_for_cq: string,
) {
  if (file_manager.exist_index(index_type_for_cq)) {
    return false;
  }

  const content =
    `export type * from '.${node_path.join(folder_cq, action_file_name).replace(/\.ts$/, '')}';\n` +
    `export type * from '.${node_path.join(folder_cq, handler_file_name).replace(/\.ts$/, '')}';\n\n`;

  const path = new File_Manager(module_path).to_file(index_type_for_cq, content);
  console.log(`[SUCCESS]: Export types of action ${format_name.create_command_name(capitalized_action_name)} were created in ${path}`);
  return true;
}

function create_command(
  capitalized_action_name: string,
  format_name: Format_Name,
  module_path: string,
  file: File_Manager,
  file_name: string,
) {
  const command_name = capitalized_action_name;
  const class_command_name = format_name.create_command_name(command_name);
  const tag = {
    prefix: 'command:',
    name: module_path.split(node_path.sep).at(-1) + `.${format_name.create_tag(command_name).toLowerCase()}`,
    toString() {
      return this.prefix + this.name;
    },
  };
  const interface_name_of_command = format_name.create_interface_command_or_query_name(class_command_name);
  // process.exit(1);
  const content =
    "import { ICommand } from 'mediator-r';\n\n" +
    `interface ${interface_name_of_command} extends ICommand<'${tag.name}', void> {};\n\n` +
    `export class ${class_command_name} implements ${interface_name_of_command} {\n` +
    `  readonly __tag = '${tag}';\n\n` +
    `  constructor(public payload: ${interface_name_of_command}['payload']) {}\n` +
    '}';

  const path = file.to_file(file_name, content);
  console.log(`[SUCCESS]: ${format_name.create_command_name(command_name)} was created in ${path}`);

  return { tag, class_command_name, file_name };
}

function create_query(
  capitalized_action_name: string,
  format_name: Format_Name,
  module_path: string,
  file: File_Manager,
  file_name: string,
) {
  const query_name = capitalized_action_name;
  const class_query_name = format_name.create_query_name(query_name);
  const tag = {
    prefix: 'query:',
    name: module_path.split(node_path.sep).at(-1) + `.${format_name.create_tag(query_name).toLowerCase()}`,
    toString() {
      return this.prefix + this.name;
    },
  };
  const interface_name_of_query = format_name.create_interface_command_or_query_name(class_query_name);
  // process.exit(1);
  const content =
    "import { IQuery } from 'mediator-r';\n\n" +
    `interface ${interface_name_of_query} extends IQuery<'${tag.name}', void> {};\n\n` +
    `export class ${class_query_name} implements ${interface_name_of_query} {\n` +
    `  readonly __tag = '${tag}';\n\n` +
    `  constructor(public payload: ${interface_name_of_query}['payload']) {}\n` +
    '}';

  const path = file.to_file(file_name, content);
  console.log(`[SUCCESS]: ${format_name.create_command_name(query_name)} was created in ${path}`);

  return { tag, class_query_name, file_name };
}

function create_handler(
  format_name: Format_Name,
  capitalized_action_name: string,
  action: { type: 'command' | 'query'; class_name: string },
  action_file_name: string,
  tag: { toString(): string },
  file_manager: File_Manager,
) {
  const handler_file_name = capitalized_action_name + '.handler.ts';

  if (file_manager.exist(handler_file_name)) {
    return;
  }

  const class_handler_name = format_name.create_class_handler_name(capitalized_action_name);
  const interface_handler_name = `${action.type === 'command' ? 'ICommandHandler' : 'IQueryHandler'}`;

  const content =
    `import { ${interface_handler_name} } from 'mediator-r';\n\n` +
    `import type { ${action.class_name} } from './${action_file_name}';\n\n` +
    `export class ${class_handler_name} implements ${interface_handler_name}<${action.class_name}, void> {\n` +
    `  readonly __tag = '${tag}';\n\n` +
    `  async exec({ payload }: ${action.class_name}) {}\n` +
    '}';
  // console.log(content);
  const path = file_manager.to_file(handler_file_name, content);
  console.log(`[SUCCESS]: ${class_handler_name} was created in ${path}`);

  return { class_handler_name, handler_file_name };
}

program
  .description('CLI for generate classes Command/Query/Handler')
  .argument('<name>')
  .requiredOption('-f, --folder <path>', 'path of folder, for example "feature/user/"')
  .requiredOption('-n, --name <name>', 'command/query name, for example, "Create", "GetById"')
  .option('--snake-case', 'format naming of Command/Query/Handler, by default is camel case')
  .option('-s, --subfolder <path>', 'folder of Command/Query/Handler, by default is "cq"', 'cq')
  .option('-i, --index <path>', 'name of index file with Command/Query/Handler, by default is "index.cq.ts"', 'index.cq.ts')
  .option(
    '-t, --index-type <path>',
    'name of index file with type of Command/Query/Handler, by default is "index.type.cq.ts"',
    'index.type.cq.ts',
  )
  .action(async (name, options, _command) => {
    const opts = options;
    const is_camel_case = opts.snakeCase ? false : true; // default: false;
    const module_path = node_path.resolve(opts.folder);
    const folder_cq = `/${opts.subfolder}/`;
    const index_for_cq = opts.index;
    const index_type_for_cq = opts.indexType;
    const action_name = opts.name;

    const hash_command = { 'create-query': 'query', 'create-command': 'command' };
    const type = hash_command[name];

    if (!type) {
      throw new Error(`Invalid command "${name}". List commands: "${Object.keys(hash_command).join('", "')}"`);
    }

    await main({
      is_camel_case,
      module_path,
      folder_cq,
      index_for_cq,
      index_type_for_cq,
      action: {
        name: action_name,
        type,
      },
    });
  })
  .version('0.0.1');
program.parseAsync();
