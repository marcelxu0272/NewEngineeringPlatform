export default function DispatchAttendancePage() {
  return (
    <div className="h-screen w-full bg-white">
      <iframe
        src="/dispatch-attendance/index.html"
        title="派遣人员考勤"
        className="h-full w-full border-0"
      />
    </div>
  );
}
