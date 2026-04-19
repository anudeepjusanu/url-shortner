const HeroDashboardMockup = () => {
  const clickData = [28, 45, 32, 58, 72, 64, 89, 76, 95, 82, 68, 91];
  const maxVal = Math.max(...clickData);

  return (
    <div className="relative rounded-xl border border-border bg-card shadow-soft overflow-hidden">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/50">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-border" />
          <div className="w-2.5 h-2.5 rounded-full bg-border" />
          <div className="w-2.5 h-2.5 rounded-full bg-border" />
        </div>
        <div className="flex-1 mx-8">
          <div className="bg-background border border-border rounded-md px-3 py-1 text-xs text-muted-foreground font-body max-w-xs">
            dashboard.snip.sa
          </div>
        </div>
      </div>

      {/* Dashboard content */}
      <div className="p-6 md:p-8 grid md:grid-cols-[200px_1fr] gap-6">
        {/* Sidebar */}
        <div className="hidden md:flex flex-col gap-1">
          {["Overview", "Links", "Analytics", "QR Codes", "Domains", "Settings"].map((item, i) => (
            <div
              key={item}
              className={`px-3 py-2 rounded-md text-sm font-body ${
                i === 2 ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"
              }`}
            >
              {item}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="space-y-6">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total clicks", value: "12,847" },
              { label: "Unique visitors", value: "8,293" },
              { label: "QR scans", value: "1,842" },
            ].map((stat) => (
              <div key={stat.label} className="bg-background border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground font-body">{stat.label}</p>
                <p className="text-xl font-display font-bold text-foreground mt-1">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="bg-background border border-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-display font-semibold text-foreground">Clicks over time</p>
              <span className="text-xs text-muted-foreground font-body">Last 12 days</span>
            </div>
            <div className="flex items-end gap-2 h-24">
              {clickData.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-sm bg-primary/70"
                    style={{ height: `${(val / maxVal) * 100}%` }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Recent links */}
          <div className="bg-background border border-border rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-border">
              <p className="text-sm font-display font-semibold text-foreground">Recent links</p>
            </div>
            {[
              { short: "snip.sa/launch", clicks: "2,341", dest: "mysite.com/product-launch-2026" },
              { short: "snip.sa/demo", clicks: "891", dest: "app.example.com/demo-request" },
              { short: "snip.sa/sale", clicks: "1,204", dest: "store.example.sa/ramadan-sale" },
            ].map((link) => (
              <div key={link.short} className="flex items-center justify-between px-5 py-3 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-body font-medium text-primary">{link.short}</p>
                  <p className="text-xs text-muted-foreground font-body truncate max-w-[200px]">{link.dest}</p>
                </div>
                <span className="text-sm font-display font-semibold text-foreground">{link.clicks}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroDashboardMockup;
