import type { ReactNode } from "react";
import {
  Document,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { Resume } from "@/lib/resume-schema";

const accent = "#0f766e";
const ink = "#111827";
const muted = "#4b5563";
const soft = "#e5e7eb";

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 40,
    paddingHorizontal: 48,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: ink,
    lineHeight: 1.4,
  },
  header: {
    marginBottom: 14,
  },
  headerTop: {
    marginBottom: 4,
  },
  nameWrap: {
    paddingBottom: 10,
  },
  name: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: ink,
    letterSpacing: 0.2,
    lineHeight: 1.15,
  },
  headlineWrap: {
    paddingBottom: 4,
  },
  headline: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: accent,
    letterSpacing: 1,
    textTransform: "uppercase",
    lineHeight: 1.2,
  },
  accentBar: {
    height: 2.5,
    backgroundColor: accent,
    marginTop: 8,
    marginBottom: 10,
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  contactItem: {
    fontSize: 9,
    color: muted,
  },
  contactSep: {
    fontSize: 9,
    color: soft,
    marginHorizontal: 2,
  },
  summaryBox: {
    backgroundColor: "#f8fafc",
    borderLeftWidth: 2,
    borderLeftColor: accent,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  summary: {
    fontSize: 9.5,
    color: muted,
    lineHeight: 1.45,
  },
  section: {
    marginTop: 14,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: ink,
    borderBottomWidth: 1,
    borderBottomColor: soft,
    paddingBottom: 4,
    marginBottom: 8,
  },
  item: {
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 2,
  },
  itemTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10.5,
    flexGrow: 1,
    flexShrink: 1,
  },
  itemMeta: {
    fontSize: 9,
    color: muted,
    flexShrink: 0,
  },
  itemSubtitle: {
    fontSize: 9.5,
    color: muted,
    marginBottom: 3,
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 2,
    paddingLeft: 2,
  },
  bulletMark: {
    width: 10,
    fontSize: 10,
    color: accent,
  },
  bulletText: {
    flex: 1,
    color: "#374151",
  },
  skillRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  skillLabel: {
    width: 110,
    fontFamily: "Helvetica-Bold",
    fontSize: 9.5,
  },
  skillItems: {
    flex: 1,
    color: "#374151",
  },
  link: {
    color: accent,
    textDecoration: "none",
  },
});

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <View>
      {items.map((item) => (
        <View key={item} style={styles.bulletRow}>
          <Text style={styles.bulletMark}>•</Text>
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export function ResumePdfDocument({ data }: { data: Resume }) {
  return (
    <Document
      title={`${data.name} — Resume`}
      author={data.name}
      subject={data.headline}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.nameWrap}>
              <Text style={styles.name}>{data.name}</Text>
            </View>
            <View style={styles.headlineWrap}>
              <Text style={styles.headline}>{data.headline}</Text>
            </View>
          </View>

          <View style={styles.accentBar} />

          <View style={styles.contactRow}>
            <Text style={styles.contactItem}>{data.location}</Text>
            <Text style={styles.contactSep}>|</Text>
            <Link
              src={`mailto:${data.email}`}
              style={{ ...styles.contactItem, ...styles.link }}
            >
              {data.email}
            </Link>
            <Text style={styles.contactSep}>|</Text>
            <Link
              src={data.github.url}
              style={{ ...styles.contactItem, ...styles.link }}
            >
              github.com/{data.github.label}
            </Link>
          </View>

          <View style={styles.summaryBox}>
            <Text style={styles.summary}>{data.summary}</Text>
          </View>
        </View>

        <Section title="Work Experience">
          {data.experience.map((job) => (
            <View key={`${job.company}-${job.period}`} style={styles.item} wrap={false}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>{job.company}</Text>
                <Text style={styles.itemMeta}>{job.period}</Text>
              </View>
              <Text style={styles.itemSubtitle}>{job.role}</Text>
              <Bullets items={job.bullets} />
            </View>
          ))}
        </Section>

        <Section title="Projects">
          {data.projects.map((project) => (
            <View key={project.name} style={styles.item} wrap={false}>
              <View style={styles.itemHeader}>
                {project.url ? (
                  <Link
                    src={project.url}
                    style={{ ...styles.itemTitle, ...styles.link }}
                  >
                    {project.name}
                  </Link>
                ) : (
                  <Text style={styles.itemTitle}>{project.name}</Text>
                )}
              </View>
              <Text style={styles.itemSubtitle}>{project.stack}</Text>
              <Bullets items={project.description} />
            </View>
          ))}
        </Section>

        <Section title="Technical Skills">
          {data.skills.map((group) => (
            <View key={group.label} style={styles.skillRow} wrap={false}>
              <Text style={styles.skillLabel}>{group.label}</Text>
              <Text style={styles.skillItems}>{group.items.join(", ")}</Text>
            </View>
          ))}
        </Section>

        <Section title="Education">
          <View style={styles.item} wrap={false}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle}>{data.education.degree}</Text>
              <Text style={styles.itemMeta}>{data.education.period}</Text>
            </View>
            <Text style={styles.itemSubtitle}>
              {data.education.school} · GPAX {data.education.gpax}
            </Text>
          </View>
        </Section>

        <Section title="Activities">
          <Bullets items={data.activities} />
        </Section>

        <Section title="Interests">
          <Text>{data.interests.join(" · ")}</Text>
        </Section>
      </Page>
    </Document>
  );
}
