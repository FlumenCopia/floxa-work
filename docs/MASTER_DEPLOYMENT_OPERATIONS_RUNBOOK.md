# FLOXA WORK — MASTER DEPLOYMENT OPERATIONS RUNBOOK

**Target Platform:** Hostinger Ubuntu VPS (`89.116.121.25`) with CloudPanel  
**Audience:** Platform Operators & Sysadmins  

---

## 1. Service Management Commands (User `floxa`)

```bash
# Check service statuses
sudo systemctl status floxa-backend floxa-frontend mongod

# Restart backend
sudo systemctl restart floxa-backend

# Restart frontend
sudo systemctl restart floxa-frontend

# Inspect live backend logs
sudo journalctl -u floxa-backend -f -n 100

# Inspect live frontend logs
sudo journalctl -u floxa-frontend -f -n 100

# Check CloudPanel site Nginx logs
tail -f /home/floxa/logs/app.floxa.work/error.log
tail -f /home/floxa/logs/api.floxa.work/error.log
```

---

## 2. Reboot & Emergency Recovery Playbook

- **Reboot Resilience:** Both `floxa-backend` and `floxa-frontend` have `Restart=always` and `WantedBy=multi-user.target`. They start automatically after VPS reboot.
- **Port Conflict Safeguards:** Backend binds to `5001`, frontend binds to `3001`. They do not interfere with other Node.js apps on the VPS.
- **Secret Rotation:** If keys are leaked, update `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` in `/etc/floxa/backend.env` and restart `floxa-backend`.
