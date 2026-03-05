import PersonnelCards from './PersonnelCards'

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">SME 专家资源库</h1>
      <PersonnelCards />
    </main>
  )
}