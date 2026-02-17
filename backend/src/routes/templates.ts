import { FastifyInstance } from 'fastify'
import { query, execute, sql } from '../services/db.js'
import { randomUUID } from 'crypto'

interface Template {
  id: string
  org_id: string
  user_id: string
  name: string
  description?: string
  base_prompt?: string
  template_html?: string
  binding_schema?: string
  required_query?: string
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
  required_query?: string
  thumbnail?: string
  is_public?: boolean
  tags?: string[]
}

interface UpdateTemplateBody {
  name?: string
  description?: string
  template_html?: string
  binding_schema?: object
  required_query?: string
  thumbnail?: string
  is_public?: boolean
  tags?: string[]
}

export async function templatesRoutes(fastify: FastifyInstance) {
  
  // ============== LIST TEMPLATES ==============
  // GET /api/templates?org_id=xxx&user_id=xxx
  fastify.get<{
    Querystring: { org_id: string; user_id?: string; include_public?: string }
  }>('/api/templates', async (request, reply) => {
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
      
      // Parse binding_schema JSON
      const parsed = templates.map(t => ({
        ...t,
        binding_schema: t.binding_schema ? JSON.parse(t.binding_schema) : null,
        tags: t.tags ? t.tags.split(',') : [],
      }))

      return { templates: parsed }
    } catch (error: any) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Error listando templates', details: error.message })
    }
  })

  // ============== GET SINGLE TEMPLATE ==============
  // GET /api/templates/:id
  fastify.get<{
    Params: { id: string }
  }>('/api/templates/:id', async (request, reply) => {
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
        tags: t.tags ? t.tags.split(',') : [],
      }
    } catch (error: any) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Error obteniendo template', details: error.message })
    }
  })

  // ============== CREATE TEMPLATE ==============
  // POST /api/templates
  fastify.post<{
    Body: CreateTemplateBody
  }>('/api/templates', async (request, reply) => {
    const { 
      org_id, user_id, name, description, base_prompt, 
      template_html, binding_schema, required_query, 
      thumbnail, is_public, tags 
    } = request.body

    if (!org_id || !user_id || !name) {
      return reply.status(400).send({ error: 'org_id, user_id y name son requeridos' })
    }

    try {
      const id = randomUUID()
      const bindingJson = binding_schema ? JSON.stringify(binding_schema) : null
      const tagsStr = tags ? tags.join(',') : null

      await execute(`
        INSERT INTO templates (
          id, org_id, user_id, name, description, base_prompt,
          template_html, binding_schema, required_query, 
          thumbnail, is_public, tags, created_at, updated_at
        ) VALUES (
          @id, @org_id, @user_id, @name, @description, @base_prompt,
          @template_html, @binding_schema, @required_query,
          @thumbnail, @is_public, @tags, GETDATE(), GETDATE()
        )
      `, {
        id, org_id, user_id, name, description, base_prompt,
        template_html, binding_schema: bindingJson, required_query,
        thumbnail, is_public: is_public ? 1 : 0, tags: tagsStr
      })

      return { success: true, id, message: 'Template creado' }
    } catch (error: any) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Error creando template', details: error.message })
    }
  })

  // ============== UPDATE TEMPLATE ==============
  // PUT /api/templates/:id
  fastify.put<{
    Params: { id: string }
    Body: UpdateTemplateBody
  }>('/api/templates/:id', async (request, reply) => {
    const { id } = request.params
    const updates = request.body

    if (Object.keys(updates).length === 0) {
      return reply.status(400).send({ error: 'No hay campos para actualizar' })
    }

    try {
      // Build dynamic update query
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
      if (updates.required_query !== undefined) {
        setClauses.push('required_query = @required_query')
        params.required_query = updates.required_query
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
  // DELETE /api/templates/:id
  fastify.delete<{
    Params: { id: string }
  }>('/api/templates/:id', async (request, reply) => {
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
  // POST /api/templates/:id/execute
  // Este endpoint se implementará cuando integremos con Ivy
  fastify.post<{
    Params: { id: string }
    Body: { parameters?: Record<string, any> }
  }>('/api/templates/:id/execute', async (request, reply) => {
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
      // Por ahora retornamos el template con los parámetros
      return {
        success: true,
        template_id: id,
        parameters,
        message: 'Ejecución de template - TODO: integrar con Ivy',
        template_html: template.template_html,
        binding_schema: template.binding_schema ? JSON.parse(template.binding_schema) : null,
      }
    } catch (error: any) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Error ejecutando template', details: error.message })
    }
  })
}
