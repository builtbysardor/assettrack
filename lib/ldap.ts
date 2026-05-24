import ldap from "ldapjs";

const LDAP_URL = process.env.LDAP_URL ?? "ldap://localhost:389";
const LDAP_BASE_DN = process.env.LDAP_BASE_DN ?? "dc=company,dc=com";
const LDAP_BIND_DN = process.env.LDAP_BIND_DN ?? "cn=admin,dc=company,dc=com";
const LDAP_BIND_PASSWORD = process.env.LDAP_BIND_PASSWORD ?? "admin";
const LDAP_ENABLED = process.env.LDAP_ENABLED === "true";

export interface LdapUser {
  dn: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  department: string;
}

function createClient(): ldap.Client {
  return ldap.createClient({ url: LDAP_URL, timeout: 5000, connectTimeout: 5000 });
}

async function bindClient(client: ldap.Client): Promise<void> {
  return new Promise((resolve, reject) => {
    client.bind(LDAP_BIND_DN, LDAP_BIND_PASSWORD, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export async function createLdapAccount(user: LdapUser): Promise<{ success: boolean; dn: string; error?: string }> {
  if (!LDAP_ENABLED) {
    // Simulation mode
    const dn = `uid=${user.username},ou=users,${LDAP_BASE_DN}`;
    return { success: true, dn };
  }

  const client = createClient();
  try {
    await bindClient(client);
    const dn = `uid=${user.username},ou=users,${LDAP_BASE_DN}`;
    const entry = {
      objectClass: ["inetOrgPerson", "posixAccount", "shadowAccount"],
      uid: user.username,
      cn: `${user.firstName} ${user.lastName}`,
      sn: user.lastName,
      givenName: user.firstName,
      mail: user.email,
      ou: user.department,
      uidNumber: String(Math.floor(Math.random() * 9000) + 1000),
      gidNumber: "500",
      homeDirectory: `/home/${user.username}`,
      loginShell: "/bin/bash",
      userPassword: generateInitialPassword(user.firstName, user.lastName),
    };

    await new Promise<void>((resolve, reject) => {
      client.add(dn, entry, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    return { success: true, dn };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "LDAP error";
    return { success: false, dn: "", error: message };
  } finally {
    client.destroy();
  }
}

export async function deleteLdapAccount(dn: string): Promise<{ success: boolean; error?: string }> {
  if (!LDAP_ENABLED) {
    return { success: true };
  }

  const client = createClient();
  try {
    await bindClient(client);
    await new Promise<void>((resolve, reject) => {
      client.del(dn, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "LDAP error";
    return { success: false, error: message };
  } finally {
    client.destroy();
  }
}

function generateInitialPassword(firstName: string, lastName: string): string {
  return `${firstName.charAt(0).toUpperCase()}${lastName.toLowerCase()}@2024!`;
}
