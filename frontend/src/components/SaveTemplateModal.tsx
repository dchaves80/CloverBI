'use client'

import { useState } from 'react'

interface SaveTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  html: string
  basePrompt: string
  orgId: string
  userId: string
  onSuccess?: (templateId: string) => void
}

export default function SaveTemplateModal({
  isOpen,
  onClose,
  html,
  basePrompt,
  orgId,
  userId,
  onSuccess
}: SaveTemplateModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [isPublic, setIsPublic] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setError('El nombre es requerido')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/templates/from-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          html,
          description: description.trim() || undefined,
          base_prompt: basePrompt,
          org_id: orgId,
          user_id: userId,
          is_public: isPublic,
          tags: tags.length > 0 ? tags : undefined
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error guardando template')
      }

      // Success!
      onSuccess?.(data.id)
      onClose()
      
      // Reset form
      setName('')
      setDescription('')
      setTags([])
      setIsPublic(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-bg-secondary border border-bg-card rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            💾 Guardar como Template
          </h2>
          <button 
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            ⚠️ {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm text-text-secondary mb-1">
              Nombre *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Top 5 Pozos por Producción"
              className="w-full px-3 py-2 bg-bg-primary border border-bg-card rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-clover"
              autoFocus
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm text-text-secondary mb-1">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="¿Qué muestra este dashboard?"
              rows={2}
              className="w-full px-3 py-2 bg-bg-primary border border-bg-card rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-clover resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm text-text-secondary mb-1">
              Tags
            </label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {tags.map(tag => (
                <span 
                  key={tag}
                  className="px-2 py-1 bg-clover/20 text-clover rounded-full text-sm flex items-center gap-1"
                >
                  {tag}
                  <button 
                    onClick={() => removeTag(tag)}
                    className="hover:text-red-400"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Agregar tag..."
                className="flex-1 px-3 py-2 bg-bg-primary border border-bg-card rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-clover text-sm"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-3 py-2 bg-bg-card hover:bg-border rounded-lg text-text-secondary text-sm"
              >
                +
              </button>
            </div>
          </div>

          {/* Público */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4 rounded border-bg-card text-clover focus:ring-clover"
            />
            <span className="text-sm text-text-secondary">
              Compartir con mi organización
            </span>
          </label>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-text-secondary hover:text-text-primary transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="px-4 py-2 bg-clover hover:bg-clover-dark disabled:opacity-50 rounded-lg text-white font-medium transition flex items-center gap-2"
          >
            {saving ? (
              <>
                <span className="animate-spin">🍀</span>
                Guardando...
              </>
            ) : (
              <>
                💾 Guardar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
