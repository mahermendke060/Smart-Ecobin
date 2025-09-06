const Analytics = () => {
  return (
    <div className="w-full h-screen p-4">
      <h1 className="text-xl font-semibold mb-4 text-center text-teal-700">
        📊 Analytics Dashboard
      </h1>
      <iframe
        src="https://apache-superset.aiqure.in/superset/dashboard/29/?native_filters_key=OZ02QPGliwk&standalone=1"
        width="100%"
        height="100%"
        style={{ border: "none", minHeight: "85vh", borderRadius: "12px" }}
        title="Superset Analytics"
        allow="fullscreen"
      />
    </div>
  );
};

export default Analytics;