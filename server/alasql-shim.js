const alasql = require('alasql');

// Register custom strftime function to support SQLite date formatting in AlaSQL
alasql.fn.strftime = function(format, dateStr) {
  const date = dateStr ? new Date(dateStr) : new Date();
  if (isNaN(date.getTime())) return dateStr;
  
  if (format === '%Y-%m') {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }
  if (format === '%Y-%m-%d') {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return dateStr;
};

class Statement {
  constructor(sql) {
    this.originalSql = sql;
    
    // Clean SQL to adapt SQLite schemas and queries to AlaSQL parser
    let clean = sql
      .replace(/INSERT OR IGNORE INTO/gi, 'INSERT INTO')
      .replace(/AUTOINCREMENT/gi, 'AUTO_INCREMENT')
      .replace(/FOREIGN KEY\s*\([^)]+\)\s*REFERENCES\s*[a-zA-Z0-9_]+\([^)]+\),?/gi, '')
      .replace(/UNIQUE\s*\([^)]+\),?/gi, '')
      .replace(/CURRENT_TIMESTAMP/gi, 'NOW()')
      .replace(/\btotal\b/gi, '`total`')
      .replace(/,\s*\)/g, ')')
      .trim();

    // AlaSQL doesn't support multiple trailing semi-colons or empty blocks
    if (clean.endsWith(';')) {
      clean = clean.slice(0, -1);
    }
    
    this.sql = clean;

    // Extract table name for INSERT queries to find last insert ID
    const insertMatch = /INSERT\s+INTO\s+([a-zA-Z0-9_]+)/i.exec(this.sql);
    this.tableName = insertMatch ? insertMatch[1] : null;
  }

  run(...params) {
    try {
      const args = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
      const res = alasql(this.sql, args);
      
      let lastInsertRowid = 0;
      if (this.tableName) {
        // Retrieve the last generated auto-increment id for the table
        const table = alasql.tables[this.tableName];
        if (table && table.identities) {
          // Find the identity column (typically the primary key 'id')
          const idCol = Object.keys(table.identities)[0];
          if (idCol) {
            lastInsertRowid = table.identities[idCol].value;
          }
        }
      }
      
      return {
        changes: Array.isArray(res) ? res.length : (typeof res === 'number' ? res : 1),
        lastInsertRowid: lastInsertRowid
      };
    } catch (err) {
      // Ignore "table already exists" and duplicate key/constraint errors for database seed/init safety
      if (err.message && (
        err.message.includes('already exists') ||
        err.message.includes('duplicate') ||
        err.message.includes('unique') ||
        err.message.includes('constraint')
      )) {
        return { changes: 0, lastInsertRowid: 0 };
      }
      console.error('AlaSQL Execute Error on:', this.sql, 'Params:', params, 'Err:', err.message);
      throw err;
    }
  }

  get(...params) {
    try {
      const args = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
      const res = alasql(this.sql, args);
      if (Array.isArray(res)) {
        return res[0] || null;
      }
      return res || null;
    } catch (err) {
      console.error('AlaSQL Get Error on:', this.sql, 'Params:', params, 'Err:', err.message);
      throw err;
    }
  }

  all(...params) {
    try {
      const args = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
      const res = alasql(this.sql, args);
      if (Array.isArray(res)) {
        return res;
      }
      return res ? [res] : [];
    } catch (err) {
      console.error('AlaSQL All Error on:', this.sql, 'Params:', params, 'Err:', err.message);
      throw err;
    }
  }
}

class Database {
  constructor(path) {
    console.log('⚡ Using Pure JS AlaSQL In-Memory Database Shim (Vercel Build Compatible)');
    alasql.options.erroronerror = true;
  }

  pragma(str) {
    // Ignored in AlaSQL
    return this;
  }

  exec(sql) {
    // Execute multiple statements separated by semicolon
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(Boolean);
      
    for (const stmt of statements) {
      new Statement(stmt).run();
    }
    return this;
  }

  prepare(sql) {
    return new Statement(sql);
  }
}

module.exports = Database;
