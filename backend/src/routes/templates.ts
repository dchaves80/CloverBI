import { FastifyInstance } from 'fastify'
import { query, execute, sql } from '../services/db.js'
import { randomUUID } from 'crypto'

// ============== SCHEMAS ==============
const templateSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    org_id: { type: 'string' },
    user_id: { type: 'string' },
    name: { type: 'string' },
    description: { type: 'string', nullable: true },
    base_prompt: { type: 'string', nullable: true },
    template_html: { type: 'string', nullable: true },
    binding_schema: { type: 'object', additionalProperties: true, nullable: true },
    queries: { type: 'object', additionalProperties: true, nullable: true },
    thumbnail: { type: 'string', nullable: true },
    is_public: { type: 'boolean' },
    tags: { type: 'array', items: { type: 'string' } },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
  },
}

const createTemplateSchema = {
  type: 'object',
  required: ['org_id', 'user_id', 'name'],
  properties: {
    org_id: { type: 'string', description: 'ID de la organización (de localStorage cloverbi_user)' },
    user_id: { type: 'string', description: 'ID del usuario (de localStorage cloverbi_user)' },
    name: { type: 'string', description: 'Nombre del template' },
    description: { type: 'string', description: 'Descripción opcional' },
    base_prompt: { type: 'string', description: 'Prompt original que generó el dashboard' },
    template_html: { type: 'string', description: 'HTML con {{placeholders}}' },
    binding_schema: { type: 'object', description: 'Schema de binding para rehidratar' },
    queries: { type: 'object', additionalProperties: true, description: 'Queries SQL nombradas {alias: sql}' },
    thumbnail: { type: 'string', description: 'Preview en base64' },
    is_public: { type: 'boolean', default: false, description: 'Compartir con la organización' },
    tags: { type: 'array', items: { type: 'string' }, description: 'Tags para búsqueda' },
  },
}

interface Template {
  id: string
  org_id: string
  user_id: string
  name: string
  description?: string
  base_prompt?: string
  template_html?: string
  binding_schema?: string
  queries?: Record<string, string>
  thumbnail?: string
  is_public: boolean
  tags?: string
  created_at: Date
  updated_at: Date
}

interface CreateTemplateBody {
  org_id: string
  user_id: string
  name: string
  description?: string
  base_prompt?: string
  template_html?: string
  binding_schema?: object
  queries?: Record<string, string>
  thumbnail?: string
  is_public?: boolean
  tags?: string[]
}

interface UpdateTemplateBody {
  name?: string
  description?: string
  template_html?: string
  binding_schema?: object
  queries?: Record<string, string>
  thumbnail?: string
  is_public?: boolean
  tags?: string[]
}

export async function templatesRoutes(fastify: FastifyInstance) {
  
  // ============== LIST TEMPLATES ==============
  fastify.get<{
    Querystring: { org_id: string; user_id?: string; include_public?: string }
  }>('/api/templates', {
    schema: {
      description: 'Listar templates de la organización',
      tags: ['templates'],
      querystring: {
        type: 'object',
        required: ['org_id'],
        properties: {
          org_id: { type: 'string', description: 'ID de la organización' },
          user_id: { type: 'string', description: 'ID del usuario (opcional)' },
          include_public: { type: 'string', enum: ['true', 'false'], description: 'Incluir templates públicos' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            templates: { type: 'array', items: templateSchema },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { org_id, user_id, include_public } = request.query

    if (!org_id) {
      return reply.status(400).send({ error: 'org_id requerido' })
    }

    try {
      let sqlQuery = `
        SELECT * FROM templates 
        WHERE org_id = @org_id
      `
      
      if (user_id && include_public !== 'true') {
        sqlQuery += ` AND (user_id = @user_id OR is_public = 1)`
      }
      
      sqlQuery += ` ORDER BY updated_at DESC`

      const templates = await query<Template>(sqlQuery, { org_id, user_id })
      
      const parsed = templates.map(t => ({
        ...t,
        binding_schema: t.binding_schema ? JSON.parse(t.binding_schema) : null,
        queries: t.queries ? JSON.parse(t.queries as unknown as string) : null,
        tags: t.tags ? t.tags.split(',') : [],
      }))

      return { templates: parsed }
    } catch (error: any) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Error listando templates', details: error.message })
    }
  })

  // ============== GET SINGLE TEMPLATE ==============
  fastify.get<{
    Params: { id: string }
  }>('/api/templates/:id', {
    schema: {
      description: 'Obtener un template por ID',
      tags: ['templates'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: templateSchema,
        404: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params

    try {
      const templates = await query<Template>(
        `SELECT * FROM templates WHERE id = @id`,
        { id }
      )

      if (templates.length === 0) {
        return reply.status(404).send({ error: 'Template no encontrado' })
      }

      const t = templates[0]
      return {
        ...t,
        binding_schema: t.binding_schema ? JSON.parse(t.binding_schema) : null,
        queries: t.queries ? JSON.parse(t.queries as unknown as string) : null,
        tags: t.tags ? t.tags.split(',') : [],
      }
    } catch (error: any) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Error obteniendo template', details: error.message })
    }
  })

  // ============== CREATE TEMPLATE ==============
  fastify.post<{
    Body: CreateTemplateBody
  }>('/api/templates', {
    schema: {
      description: 'Crear un nuevo template',
      tags: ['templates'],
      body: createTemplateSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            id: { type: 'string', format: 'uuid' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { 
      org_id, user_id, name, description, base_prompt, 
      template_html, binding_schema, queries, 
      thumbnail, is_public, tags 
    } = request.body

    if (!org_id || !user_id || !name) {
      return reply.status(400).send({ error: 'org_id, user_id y name son requeridos' })
    }

    try {
      const id = randomUUID()
      const bindingJson = binding_schema ? JSON.stringify(binding_schema) : null
      const queriesJson = queries ? JSON.stringify(queries) : null
      const tagsStr = tags ? tags.join(',') : null

      await execute(`
        INSERT INTO templates (
          id, org_id, user_id, name, description, base_prompt,
          template_html, binding_schema, queries, 
          thumbnail, is_public, tags, created_at, updated_at
        ) VALUES (
          @id, @org_id, @user_id, @name, @description, @base_prompt,
          @template_html, @binding_schema, @queries,
          @thumbnail, @is_public, @tags, GETDATE(), GETDATE()
        )
      `, {
        id, org_id, user_id, name, description, base_prompt,
        template_html, binding_schema: bindingJson, queries: queriesJson,
        thumbnail, is_public: is_public ? 1 : 0, tags: tagsStr
      })

      return { success: true, id, message: 'Template creado' }
    } catch (error: any) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Error creando template', details: error.message })
    }
  })

  // ============== UPDATE TEMPLATE ==============
  fastify.put<{
    Params: { id: string }
    Body: UpdateTemplateBody
  }>('/api/templates/:id', {
    schema: {
      description: 'Actualizar un template existente',
      tags: ['templates'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          template_html: { type: 'string' },
          binding_schema: { type: 'object' },
          queries: { type: 'object', additionalProperties: true },
          thumbnail: { type: 'string' },
          is_public: { type: 'boolean' },
          tags: { type: 'array', items: { type: 'string' } },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params
    const updates = request.body

    if (Object.keys(updates).length === 0) {
      return reply.status(400).send({ error: 'No hay campos para actualizar' })
    }

    try {
      const setClauses: string[] = ['updated_at = GETDATE()']
      const params: Record<string, any> = { id }

      if (updates.name !== undefined) {
        setClauses.push('name = @name')
        params.name = updates.name
      }
      if (updates.description !== undefined) {
        setClauses.push('description = @description')
        params.description = updates.description
      }
      if (updates.template_html !== undefined) {
        setClauses.push('template_html = @template_html')
        params.template_html = updates.template_html
      }
      if (updates.binding_schema !== undefined) {
        setClauses.push('binding_schema = @binding_schema')
        params.binding_schema = JSON.stringify(updates.binding_schema)
      }
      if (updates.queries !== undefined) {
        setClauses.push('queries = @queries')
        params.queries = JSON.stringify(updates.queries)
      }
      if (updates.thumbnail !== undefined) {
        setClauses.push('thumbnail = @thumbnail')
        params.thumbnail = updates.thumbnail
      }
      if (updates.is_public !== undefined) {
        setClauses.push('is_public = @is_public')
        params.is_public = updates.is_public ? 1 : 0
      }
      if (updates.tags !== undefined) {
        setClauses.push('tags = @tags')
        params.tags = updates.tags.join(',')
      }

      const rowsAffected = await execute(
        `UPDATE templates SET ${setClauses.join(', ')} WHERE id = @id`,
        params
      )

      if (rowsAffected === 0) {
        return reply.status(404).send({ error: 'Template no encontrado' })
      }

      return { success: true, message: 'Template actualizado' }
    } catch (error: any) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Error actualizando template', details: error.message })
    }
  })

  // ============== DELETE TEMPLATE ==============
  fastify.delete<{
    Params: { id: string }
  }>('/api/templates/:id', {
    schema: {
      description: 'Eliminar un template',
      tags: ['templates'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params

    try {
      const rowsAffected = await execute(
        `DELETE FROM templates WHERE id = @id`,
        { id }
      )

      if (rowsAffected === 0) {
        return reply.status(404).send({ error: 'Template no encontrado' })
      }

      return { success: true, message: 'Template eliminado' }
    } catch (error: any) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Error eliminando template', details: error.message })
    }
  })

  // ============== EXECUTE TEMPLATE ==============
  fastify.post<{
    Params: { id: string }
    Body: { parameters?: Record<string, any> }
  }>('/api/templates/:id/execute', {
    schema: {
      description: 'Ejecutar un template con parámetros (rehidratar con data fresca)',
      tags: ['templates'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      body: {
        type: 'object',
        properties: {
          parameters: { 
            type: 'object', 
            description: 'Parámetros para el template (ej: {date_range: {...}, sucursal: "all"})' 
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            template_id: { type: 'string' },
            parameters: { type: 'object' },
            html: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params
    const { parameters } = request.body

    try {
      const templates = await query<Template>(
        `SELECT * FROM templates WHERE id = @id`,
        { id }
      )

      if (templates.length === 0) {
        return reply.status(404).send({ error: 'Template no encontrado' })
      }

      const template = templates[0]
      
      // TODO: Integrar con Ivy para rehidratar el template
      return {
        success: true,
        template_id: id,
        parameters,
        message: 'Ejecución de template - TODO: integrar con Ivy',
        html: template.template_html,
        binding_schema: template.binding_schema ? JSON.parse(template.binding_schema) : null,
      }
    } catch (error: any) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Error ejecutando template', details: error.message })
    }
  })

  // ============== CREATE FROM HTML (con parser CLOVER) ==============
  fastify.post<{
    Body: {
      name: string
      html: string
      description?: string
      base_prompt?: string
      org_id: string
      user_id: string
      is_public?: boolean
      tags?: string[]
    }
  }>('/api/templates/from-html', {
    schema: {
      description: 'Crear template parseando metadata CLOVER del HTML',
      tags: ['templates'],
      body: {
        type: 'object',
        required: ['name', 'html', 'org_id', 'user_id'],
        properties: {
          name: { type: 'string', description: 'Nombre del template' },
          html: { type: 'string', description: 'HTML con metadata CLOVER' },
          description: { type: 'string' },
          base_prompt: { type: 'string', description: 'Prompt original' },
          org_id: { type: 'string' },
          user_id: { type: 'string' },
          is_public: { type: 'boolean', default: false },
          tags: { type: 'array', items: { type: 'string' } },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            id: { type: 'string' },
            message: { type: 'string' },
            extracted: {
              type: 'object',
              properties: {
                componentCount: { type: 'number' },
                queryIds: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { name, html, description, base_prompt, org_id, user_id, is_public, tags } = request.body

    // Importar parser
    const { parseCloverMetadata, hasCloverMetadata, stripCloverInforme } = await import('../utils/clover-parser.js')

    // Validar que tenga metadata CLOVER
    if (!hasCloverMetadata(html)) {
      return reply.status(400).send({ 
        error: 'El HTML no contiene metadata CLOVER',
        hint: 'Asegurate de que Ivy genere con <!--CLOVER:BEGIN--> comments'
      })
    }

    try {
      // Stripear sección de informe antes de guardar
      const cleanHtml = stripCloverInforme(html)

      // Parsear metadata
      const parsed = parseCloverMetadata(cleanHtml)
      
      if (parsed.componentCount === 0) {
        return reply.status(400).send({ 
          error: 'No se encontraron componentes CLOVER válidos',
          hint: 'Formato esperado: <!--CLOVER:BEGIN type="..." id="..."--><!--CLOVER:SQL ...-->'
        })
      }

      // Crear template
      const id = randomUUID()
      const queriesJson = JSON.stringify(parsed.queries)
      const bindingSchema = JSON.stringify({
        version: '2.0',
        components: parsed.components.map(c => ({ id: c.id, type: c.type }))
      })
      const tagsStr = tags ? tags.join(',') : null

      await execute(`
        INSERT INTO templates (
          id, org_id, user_id, name, description, base_prompt,
          template_html, binding_schema, queries,
          thumbnail, is_public, tags, created_at, updated_at
        ) VALUES (
          @id, @org_id, @user_id, @name, @description, @base_prompt,
          @template_html, @binding_schema, @queries,
          NULL, @is_public, @tags, GETDATE(), GETDATE()
        )
      `, {
        id,
        org_id,
        user_id,
        name,
        description: description || null,
        base_prompt: base_prompt || null,
        template_html: cleanHtml,
        binding_schema: bindingSchema,
        queries: queriesJson,
        is_public: is_public ? 1 : 0,
        tags: tagsStr
      })

      return {
        success: true,
        id,
        message: 'Template creado desde HTML',
        extracted: {
          componentCount: parsed.componentCount,
          queryIds: Object.keys(parsed.queries)
        }
      }
    } catch (error: any) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Error creando template', details: error.message })
    }
  })
}
