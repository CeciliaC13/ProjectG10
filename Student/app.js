async function loadData() {
  const { data, error } = await db
    .from('your_table')
    .select('*')

  if (error) {
    console.error('Error:', error.message)
    return
  }

  const output = document.getElementById('output')
  output.innerHTML = data.map(row => `
    <div class="card mb-2">
      <div class="card-body">
        <p>${JSON.stringify(row)}</p>
      </div>
    </div>
  `).join('')
}

loadData()