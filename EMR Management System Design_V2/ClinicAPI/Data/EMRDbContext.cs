using Microsoft.EntityFrameworkCore;
using ClinicAPI.Models;

namespace ClinicAPI.Data;

public class EMRDbContext : DbContext
{
    public EMRDbContext(DbContextOptions<EMRDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<Patient> Patients { get; set; }
    public DbSet<MedicalRecord> MedicalRecords { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Cấu hình mã bệnh nhân là duy nhất
        modelBuilder.Entity<Patient>()
            .HasIndex(p => p.PatientCode)
            .IsUnique();
    }
}