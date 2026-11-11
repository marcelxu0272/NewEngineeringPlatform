export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 text-gray-700">
      <h1 className="text-2xl font-semibold text-gray-800">需要登录</h1>
      <p className="mt-3 text-sm leading-6">
        工程平台只对已登录的 Cursor 用户开放。发布时请选择「私人」或「团队」。公开链接没有登录入口，页面会停在这里。
      </p>
    </main>
  );
}
