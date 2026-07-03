import api from './client'

export async function fetchContractTemplates() {
  const { data } = await api.get('/api/v1/contract-templates')
  return data.data ?? data
}

export async function createContractTemplate(payload) {
  const { data } = await api.post('/api/v1/contract-templates', payload)
  return data.data ?? data
}

export async function updateContractTemplate(id, payload) {
  const { data } = await api.put(`/api/v1/contract-templates/${id}`, payload)
  return data.data ?? data
}

export async function deleteContractTemplate(id) {
  await api.delete(`/api/v1/contract-templates/${id}`)
}

export async function previewContractTemplate(id, projectId) {
  const { data } = await api.get(`/api/v1/contract-templates/${id}/preview`, {
    params: projectId ? { project_id: projectId } : {},
  })
  return data
}

export async function compileContract({ contract_template_id, project_id }) {
  const { data } = await api.post('/api/v1/contracts/compile', {
    contract_template_id,
    project_id,
  })
  return data.data ?? data
}

export async function fetchContracts(params = {}) {
  const { data } = await api.get('/api/v1/contracts', { params })
  return data
}

export async function fetchContract(id) {
  const { data } = await api.get(`/api/v1/contracts/${id}`)
  return data.data ?? data
}

export async function submitTenantSignature(contractId, signatureData) {
  const { data } = await api.post(`/api/v1/contracts/${contractId}/tenant-signature`, {
    signature_data: signatureData,
  })
  return data.data ?? data
}
